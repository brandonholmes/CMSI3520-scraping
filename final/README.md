# Partner Portal

## Background

The Partner Portal extends the functionality of the StarRez Housing Information System. This portal provides a way for housing professionals to give institution (organization) staff access to manage specific housing processes without accessing the SHIS directly. The Partner Portal can be accessed [here](https://partnerportal.info).

## Current Funcationality

### Early Arrival

The early arrival functionality allows staff to creates groups of students that need to check-in to student housing early.

## Database Schema

The Partner Portal is built with the Firestore Document Database. It uses a standard model of documents and fields to ensure data management which is maintained through the functions in dataServices.js.

### Collections

The database is composed of the following collections:

**Access**

The Access Collection contains a document for each module in the Partner Portal for each organization that uses the Partner Portal to indicate whether users of that organization can access the particular module.

| Field        | Related Collection | Data Type | Additional Information |
| ------------ | -----------------  | --------- | ---------------------- |  
| Description  |                    | String    | A description of what the key controls access to. |
| Id           |                    | String    | The id of the document in the collection. |
| Name         |                    | String    | The name of the module this document controls access to.|
| OrgCode      |                    | String    | The OrgCode this document key belongs to. Indicates which organization is affected by this document.|
| Status       |                    | String    | Inicates what level of access users of this organization have to this module. Can be one of four values "Admin Only", "Access", "No Access", or "Read Only"|


**Group Memberships**

The Group Memberships Collection contains junction documents that represent a Member that should be part of Group.

| Field        | Related Collection | Data Type | Additional Information |
| ------------ | -----------------  | --------- | ---------------------- |
| Group Id     | Groups             | String    | The document id of the group that the member is supposed to be part of.|
| Member Id    | Members            | String    | The document id of a member.|


**Groups**

| Fields       | Related Collection | Data Type | Additional Information | 
| ------------ | -----------------  | --------- | ---------------------- |
| Date         |                    | String    | Uses a string to represent the date that the group members need to arrival early. Stores the date in the format YYYY-MM-DD instead of using firestores datetime value format.
| Name         |                    | String    | The name of the group. |
| OrgCode      |                    | String    | The OrgCode this document belongs to. Indicates which organization this group belongs to.|
| OwnerId      |                    | String    | The user id of the user that created and owns this group.|
| Status       |                    | String    | Indicates whether the group has been processed by housing staff. Can be one of three values: "Pending", "Approved", "Denied".|
| Term         |                    | Map       | Contains of copy of all the term data for the term this group applies to.|
| TermId       | Terms              | String    | The document id of the term that this group applies.|


**Members**

The Members Collection contains a document for each person/student in the organization for the term. 

| Fields       | Related Collection | Data Type | Additional Information | 
| ------------ | -----------------  | --------- | ---------------------- |
| EarliestDate |                    | String    | Indicates the earliest date of all groups the member belongs to for the term. Stores the date in the format YYYY-MM-DD instead of using the firestores datetime value format.|
| First        |                    | String    | The member's first name.|
| Id           |                    | String    | The id of the document in the collection.|
| Last         |                    | String    | The member's last name.|
| OrgCode      |                    | String    | The OrgCode this document belongs to. Indicates which organization this member belongs to.|
| OrgId        |                    | String    | The members unique Id at the institution, typically the members Student ID number.|
| SystemId     | External ID        | String    | The id of the members record in the housing information system.|
| TermId       | Term               | String    | The id of the term document from the term table that this member is relevant to.|


**Messages**

The Messages Collection contains documents for each message that should be displayed on the dashboard. Some messages display for all users in the system, other messages display only for users within the specified organization.

| Fields       | Related Collection | Data Type | Additional Information | 
| ------------ | -----------------  | --------- | ---------------------- |
| Active       |                    | Boolean   | Whether the message is active and should display on the dashboard.|
| Content      |                    | String    | The content/message that should display.|
| End          |                    | String    | The end date (the last day) that the message should display on the dashbaord. Stores the date in the format YYYY-MM-DD instead of using the firestores datetime format.
| OrgCode      |                    | String    | The OrgCode this document belongs to. Indicates which organizatation the message should display for if an organization message.|
| Start        |                    | String    | The start date (the first day) that the message should display on the dashboard. Stores the date in the format YYYY-MM-DD instead of using the firestores datetime format.
| Type         |                    | String    | Indicates whether the message is a system message for all users of the system, or an organization message that displays just for the users of the organization reprsented by the OrgCode. Can be one of two values: "Organization" or "System".|


**Organizations**

The Organizations Collection contains a document for each organization that uses the system and contains important information that is used across the system for various functioality.

| Fields       | Related Collection | Data Type | Additional Information | 
| ------------ | -----------------  | --------- | ---------------------- |
| Active       |                    | Boolean   | Indicates whether the organization is active in the system and determines if users from that organization can login to the system.|
| Domains      |                    | String    | A comma or semi-colon separate list of domains that are allowed for email addresses when a user creates their account. Allows organizations to make sure that only certain people can create an account connected to their organization in the system as email addresses have to be verified before a user can access the system.|
| FieldId      |                    | String    | Indicates the field id number of the field in the housing information system that early arrival approval should be when the API is used to process requests from the partner portal into their system.|
| Name         |                    | String    | The name of the organization.|
| OrgCode      |                    | String    | The code that connects records to this organization. Used in other tables to associate records with an organization and has to be provided at user creation for user accounts to be created so users can be associated with their organization and access it's records.|
| Secret       |                    | String    | The encoded version of a username and password used to access the API when connecting to the organizations housing information system.|


**Profiles**

The Profiles Collection contains a document for each user in the system to record additioanl information and settings for the user.

| Fields       | Related Collection | Data Type | Additional Information | 
| ------------ | -----------------  | --------- | ---------------------- |
| Active       |                    | Boolean   | Indicates if the user is active and can access the system. Controlled by the admins of the organization.|
| Admin        |                    | Boolean   | Indicates if the user is an admin for the organization and can access the setup screens in the portal.|
| Email        |                    | String    | The email address of the user.|
| Name         |                    | String    | The full name of the user.|
| OrgCode      |                    | String    | The OrgCode this document belongs to. Indicates which organization this user is connected to.|
| UId          |                    | String    | The UId of the user record from the Firebase Authentication module.|
| Verified     |                    | String    | Indicates whether the user has verified their email address and can login to the portal.|


**Terms**

The Terms Collection contains a document for each term at an organization that the organization wants users to input data for and/or can select from when inputing data and requests in the portal.

| Fields       | Related Collection | Data Type | Additional Information | 
| ------------ | -----------------  | --------- | ---------------------- |
| Active       |                    | Boolean   | Indicates whether the term is active and can be seen by non admins in different funcations of the portal.|
| Earliest     |                    | String    | The earliest date that a group associated with this term can have. Stores the date in the format YYYY-MM-DD instead of using the firestores datetime format.|
| Latest       |                    | String    | The latest date that a group associated with this term can have. Stores the date in the format YYYY-MM-DD instead of using the firestores datetime format.
| Name         |                    | String    | The name of the term.|
| OrgCode      |                    | String    | The OrgCoe this document belongs to. Indicates which organization this term is associated with.|
| OrgId        |                    | String    | An optional value that represents the term in the organizations housing system and is included when sending data via the API to help with data management.|
| Processed    |                    | Boolean   | Indicates whether the term has been processed and records from the partner portal have been send to the organizations housing system using the API to input early arrival data into the system.|
| TermDates    |                    | Boolean   | Indicates whether the Earliest and Latest dates for the term should be enforced when users create a Group for this Term.|
