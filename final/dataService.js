import { db } from "../firebaseConfig";
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  doc,
  documentId,
  updateDoc,
  deleteDoc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { Buffer } from "buffer";
export let globalData = {};
globalData.access = new Map();
globalData.access.set("earlyArrival", "");
globalData.access.set("llc", "");

// Get User Profiles from the Database
export async function getProfiles(orgCode) {
  const snapshot = await getDocs(
    query(
      collection(db, "profiles"),
      where("orgCode", "==", orgCode),
      orderBy("name")
    )
  );
  const profiles = new Map();
  snapshot.docs.map((doc) =>
    profiles.set(doc.data().uid, { uId: doc.id, ...doc.data() })
  );
  return profiles;
}

// Confirm the OrgCode Exists Organization Collection
// and Confirm Email Domain Matches Org Domains
export async function verifyOrgCode(orgCode, email, setVerified) {
  let domains = [];
  const snapshot = await getDocs(
    query(
      collection(db, "organizations"),
      where("orgCode", "==", orgCode),
      where("active", "==", true)
    )
  );

  if (!snapshot.empty) {
    if (snapshot.docs[0].data().domains === "") {
      setVerified(true);
      return true;
    } else {
      domains = snapshot.docs[0].data().domains.split(",");
      for (let i = 0; i < domains.length; i++) {
        if (email.includes(domains[i])) {
          setVerified(true);
          return true;
        }
      }
    }
    setVerified(false);
    return false;
  } else {
    setVerified(false);
  }
}

// Gets Members from the Database for the Org and selected Term
export async function getMembers(orgCode, termId) {
  const snapshot = await getDocs(
    query(
      collection(db, "members"),
      where("orgCode", "==", orgCode),
      where("termId", "==", termId),
      orderBy("last")
    )
  );
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Gets Gets Groups from the Database for the Org and selected Term
// Type determines if all groups for an org or just groups owned by a specific User
export async function getGroups(uid, orgCode, type, termId) {
  let snapshot;
  if (type === "my") {
    snapshot = await getDocs(
      query(
        collection(db, "groups"),
        where("ownerId", "==", uid),
        where("termId", "==", termId),
        orderBy("name")
      )
    );
  } else if (type === "all") {
    snapshot = await getDocs(
      query(
        collection(db, "groups"),
        where("orgCode", "==", orgCode),
        where("termId", "==", termId),
        orderBy("name")
      )
    );
  }
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Creates Group in the Database
export async function createGroup(name, date, term, orgCode, ownerId) {
  const data = {
    ownerId,
    orgCode,
    term: term,
    name,
    date,
    termId: term.id,
    status: "Pending",
  };
  const docRef = await addDoc(collection(db, "groups"), data);
  return docRef;
}

// Saves updated group Document to the Database
export async function saveGroup(group) {
  const groupRef = doc(db, "groups", group.id);
  const data = {
    name: group.name,
    date: group.date,
    term: group.term,
    status: group.status,
  };
  await updateDoc(groupRef, data);
  if (group.updatedDate === true) {
    console.log("Need To Update Date");
    getGroupMembers(group).then((members) => {
      members.forEach((m) => {
        deleteGroupMember(m.id, group.id).then(() => {
          const docRef = doc(db, "members", m.id);
          getDoc(docRef).then((docSnap) =>
            addToGroup(docSnap.data().orgId, group)
          );
        });
      });
    });
    group.updatedDate = false;
  }
}

// Removes selected group from the Database
export async function deleteGroup(groupId, ownerId, setGroups) {
  await deleteDoc(doc(db, "groups", groupId));
}


// Retrieves collection of all Group Members of a specific group
export async function getGroupMembers(group) {
  const groupMemberships = await getDocs(
    query(collection(db, "groupMemberships"), where("groupId", "==", group.id))
  );
  if (!groupMemberships.empty) {
    const memberIds = [];
    groupMemberships.forEach((member) =>
      memberIds.push(member.data().memberId)
    );

    let subList = [];
    for (var i = 0; i < memberIds.length; i += 10) {
      subList.push(
        memberIds.slice(
          i,
          i + 10 > memberIds.length ? memberIds.length : i + 10
        )
      );
    }
    let promises = [];

    subList.forEach((element) => {
      promises.push(
        getDocs(
          query(collection(db, "members"), where(documentId(), "in", element))
        )
      );
    });

    return await Promise.all(promises).then((results) =>
      results
        .map((snapshot) =>
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        )
        .flat()
    );
  }
}

// Checks if a member exists already in database or creates them for the term
// Then adds Member to the Group and updates Members Earliest Date
export async function addToGroup(id, group) {
  const membersSnapshot = await getDocs(
    query(
      collection(db, "members"),
      where("orgId", "==", id),
      where("termId", "==", group.termId)
    )
  );
  if (!membersSnapshot.empty) {
    const data = { memberId: membersSnapshot.docs[0].id, groupId: group.id };
    await addDoc(collection(db, "groupMemberships"), data);
    if (
      Date.parse(group.date) <
        Date.parse(membersSnapshot.docs[0].data().earliestDate) ||
      membersSnapshot.docs[0].data().earliestDate === "0"
    ) {
      const memberRef = doc(db, "members", membersSnapshot.docs[0].id);
      const data = { earliestDate: group.date };
      await updateDoc(memberRef, data);
    }
  } else {
    const memberData = {
      first: "Loading...",
      last: "Loading...",
      earliestDate: group.date,
      orgCode: group.orgCode,
      orgId: id,
      termId: group.termId,
    };
    const memberRef = await addDoc(collection(db, "members"), memberData);
    const groupMembershipData = { memberId: memberRef.id, groupId: group.id };
    await addDoc(collection(db, "groupMemberships"), groupMembershipData);
  }
}

// Gets terms from the database for an org
// Returns all or only active based on the user being an admin
export async function getTerms(orgCode, admin) {
  let terms = null;
  if (admin) {
    terms = await getDocs(
      query(
        collection(db, "terms"),
        where("orgCode", "==", orgCode),
        orderBy("name")
      )
    );
  } else {
    terms = await getDocs(
      query(
        collection(db, "terms"),
        where("orgCode", "==", orgCode),
        where("active", "==", true),
        orderBy("name")
      )
    );
  }

  return terms.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Gets list of a user profiles for an Org
export async function getUsers(orgCode) {
  const terms = await getDocs(
    query(
      collection(db, "profiles"),
      where("orgCode", "==", orgCode),
      orderBy("name")
    )
  );
  return terms.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Updates a user profile Document
export async function updateUser(user) {
  const userRef = doc(db, "profiles", user.id);
  const data = {
    ...user,
  };
  await updateDoc(userRef, data);
}

// Creates a Term in the database
export async function createTerm(
  name,
  orgId,
  orgCode,
  termDates,
  earliest,
  latest,
  active,
  admin
) {
  const data = {
    name,
    orgId,
    orgCode,
    processed: false,
    termDates: termDates,
    earliest: earliest,
    latest: latest,
    active: active,
  };
  console.log(data);
  await addDoc(collection(db, "terms"), data);
  return await getTerms(orgCode, admin);
}

// Updates a Term Document in the database
export async function saveTerm(
  id,
  name,
  orgId,
  orgCode,
  processed,
  termDates,
  earliest,
  latest,
  active,
  admin
) {
  const termRef = doc(db, "terms", id);
  const data = {
    name: name,
    orgId: orgId,
    processed: processed,
    termDates: termDates,
    earliest: earliest,
    latest: latest,
    active: active,
  };
  await updateDoc(termRef, data);
  return getTerms(orgCode, admin);
}

// Deletes a term in the Database
export async function deleteTerm(term) {
  await deleteDoc(doc(db, "terms", term.id));
}

// Deletes a Group Memmber from the database
// (is a join object between Member and Group collections)
export async function deleteGroupMember(memberId, groupId) {
  const groupMemberships = await getDocs(
    query(
      collection(db, "groupMemberships"),
      where("groupId", "==", groupId),
      where("memberId", "==", memberId)
    )
  );
  if (!groupMemberships.empty) {
    const groupMembership = groupMemberships.docs[0];
    await deleteDoc(doc(db, "groupMemberships", groupMembership.id));
    const memberRef = doc(db, "members", memberId);
    const remainingMemberships = await getDocs(
      query(
        collection(db, "groupMemberships"),
        where("memberId", "==", memberId)
      )
    );
    if (!remainingMemberships.empty) {
      const groupIds = [];
      remainingMemberships.docs.forEach((doc) =>
        groupIds.push(doc.data().groupId)
      );
      const groups = await getDocs(
        query(collection(db, "groups"), where(documentId(), "in", groupIds))
      );
      let earliest = groups.docs[0].data().date;
      groups.docs.forEach((g) => {
        if (Date.parse(g.data().date) < Date.parse(earliest))
          earliest = g.data().date;
      });
      await updateDoc(memberRef, { earliestDate: earliest });
    } else {
      await updateDoc(memberRef, { earliestDate: "0" });
    }
  }
}

// Gets the organization document from the database
export async function getOrganization(orgCode) {
  const snapshot = await getDocs(
    query(collection(db, "organizations"), where("orgCode", "==", orgCode))
  );
  if (!snapshot.empty) {
    return await { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
}

// Saves an orgs API credentials as an encrypted secret to the database
export async function saveCredentials(username, password, org) {
  const secret = Buffer.from(username + ":" + password).toString("base64");
  const data = { secret: secret };
  const orgRef = doc(db, "organizations", org.id);
  await updateDoc(orgRef, data);
}

// Clears the saved API credentials for an org from the database
export async function clearCredentials(org) {
  const orgRef = doc(db, "organizations", org.id);
  const data = { secret: "" };
  await updateDoc(orgRef, data);
}

// Updates an organization document in the database
export async function saveOrganization(org) {
  const orgRef = doc(db, "organizations", org.id);
  const data = { fieldId: org.fieldId, domains: org.domains };
  await updateDoc(orgRef, data);
}

// Gets all dashboard messages in the database
export async function getMessages(orgCode, active) {
  let systemSnapshot = await getDocs(
    query(
      collection(db, "messages"),
      where("type", "==", "system"),
      where("active", "==", true)
    )
  );

  if (systemSnapshot.empty) systemSnapshot = null;

  let orgSnapshot;
  if (active) {
    orgSnapshot = await getDocs(
      query(
        collection(db, "messages"),
        where("type", "==", "organization"),
        where("orgCode", "==", orgCode),
        where("active", "==", true)
      )
    );
  } else {
    orgSnapshot = await getDocs(
      query(
        collection(db, "messages"),
        where("type", "==", "organization"),
        where("orgCode", "==", orgCode)
      )
    );
  }

  if (orgSnapshot.empty) orgSnapshot = null;

  return { orgMessages: orgSnapshot, systemMessages: systemSnapshot };
}

// Updates a message document in the database
export async function saveMessage(id, start, end, active, content) {
  const messageRef = doc(db, "messages", id);
  const data = { start: start, end: end, active: active, content: content };
  await updateDoc(messageRef, data);
}

// Get access keys document for the organization from the Database
export async function getAccessKeys(orgCode) {
  const snapshot = await getDocs(
    query(collection(db, "access"), where("orgCode", "==", orgCode))
  );
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Gets access keys document and saves to a global variable
export async function loadAccessKeys(orgCode) {
  globalData.access = new Map();
  const snapshot = await getDocs(
    query(collection(db, "access"), where("orgCode", "==", orgCode))
  );

  snapshot.docs.map((doc) =>
    globalData.access.set(`${doc.data().name}`, doc.data().status)
  );
}

// Updates access keys document to set value of the passed selected key
export async function saveKey(selectedKey) {
  const keyRef = doc(db, "access", selectedKey.id);
  const data = { ...selectedKey };
  await updateDoc(keyRef, data);
}
