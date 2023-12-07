import mechanicalsoup as ms
import redis
import configparser
from elasticsearch import Elasticsearch, helpers
from neo4j import GraphDatabase

class Neo4JConnector:
	def __init__(self, uri, user, password):
		self.driver = GraphDatabase.driver(uri, auth=(user, password))
	
	def close(self):
		self.driver.close()

	def print_greeting(self, message):
		with self.driver.session() as session: 
			greeting = session.execute_write(self._create_and_return_greeting, message)
			print(greeting)

	def add_links(self, page, links):
		with self.driver.session() as session:
			session.execute_write(self._create_links, page, links)

<<<<<<< HEAD
    @staticmethod
	def _create_links(tx, page, links):
		for link in links:
			tx.run("CREATE (:Page {url: $link} ) -[:LINKS_TO]-> (:Page {url: $page} )", page=page, link=link)

neo4j_connector = Neo4JConnector("bolt://127.0.0.1:7689", "neo4j", "db_is_awesom3")

config = configparser.ConfigParser()
config.read('elastic.ini')

es = Elasticsearch(
	cloud_id=config['ELASTIC']['cloud_id'], 
	basic_auth=(config['ELASTIC']['user'], config['ELASTIC']['password'])
)

=======
	def flush_db(self):
		with self.driver.session() as session:
			session.execute_write(self._flush_db)

	@staticmethod
	def _create_links(tx, page, links):
		print("Creating page with url: " + page)
		for link in links:
			print("Creating link: " + link)
			tx.run("MERGE (p:Page {url: $page}) "
				"MERGE (l:Page {url: $link}) "
				"MERGE (p) -[:LINKS_TO]-> (l)", link=link, page=page)

	@staticmethod
	def _flush_db(tx):
		print("Flushing Database...")
		tx.run("MATCH (a) -[r]-> () DELETE a, r")
		tx.run("MATCH (a) DELETE a")
		print("Databse Flushed.")

def crawl(browser, r, es, neo, url):
	# Download url
	print("Downloading " + url)
	browser.open(url)
	print("Downloaded.")

	# Cache page to elasticsearch
	print("Caching to ElasticSearch...")
	write_to_elastic(es, url, str(browser.page))
	print("Cached to ElasticSearch.")

	# parse for more urls
	print("Parsing for more links...")
	a_tags = browser.page.find_all("a")
	hrefs = [ a.get("href") for a in a_tags ]

	# Do wikipedia specific URL filtering
	wikipedia_domain = "https://en.wikipedia.org"
	links = [ wikipedia_domain + a for a in hrefs if a and a.startswith("/wiki/") ]
	print("Links parsed.")

	# Puts urls in Redis queue
	# Create a linked list in Redis, call it "links"
	print("Pushing links onto Redis...")
	r.lpush("links", *links)
	print("Links pushed to Redis.")

	# Map Links to Neo4j
	print("Mapping Links on Neo4j...")
	neo.add_links(url, links)
	print("Mapped to Neo4j.")
>>>>>>> b5fc74b (neo)

def write_to_elastic(es, url, html):
	es.index(
		index='webpages',
		document={
			'url': url,
			'html': html
		}
	)

<<<<<<< HEAD
result = es.search(
	index='webpages',
	query={
		'match': {'html': 'html'}
	}
)

def crawl(browser, r, es, neo4jConnector, url):
	# Download url
	print("Downloading url")
	browser.open(url)

	# Cache page to elasticsearch
	write_to_elastic(es, url, str(browser.page))

	# parse for more urls
	print("Parsing for more links")
	a_tags = browser.page.find_all("a")
	hrefs = [ a.get("href") for a in a_tags ]

	# Do wikipedia specific URL filtering
	wikipedia_domain = "https://en.wikipedia.org"
	links = [ wikipedia_domain + a for a in hrefs if a and a.startswith("/wiki/") ]

	# Puts urls in Redis queue
	# Create a linked list in Redis, call it "links"
	print("Pushing links onto Redis")
	r.lpush("links", *links)
	neo4jConnector.add_links(url, links)

browser = ms.StatefulBrowser()
r = redis.Redis()

=======
# Initialize Neo4j
neo = Neo4JConnector("bolt://127.0.0.1:7689", "neo4j", "db_is_awesom3")
neo.flush_db();

# Initialize ElasticSearch
config = configparser.ConfigParser()
config.read('elastic.ini')

es = Elasticsearch(
	cloud_id=config['ELASTIC']['cloud_id'], 
	basic_auth=(config['ELASTIC']['user'], config['ELASTIC']['password'])
)

#result = es.search(
#	index='webpages',
#	query={
#		'match': {'html': 'html'}
#	}
#)

# Initialize MechanicalSoup
browser = ms.StatefulBrowser()

# Initialize Redis
r = redis.Redis()
r.flushall()

### MAIN ###
>>>>>>> b5fc74b (neo)
start_url = "https://en.wikipedia.org/wiki/Redis"
r.lpush("links", start_url)

while link := r.rpop("links"):
	if "Jesus" in str(link):
		break
<<<<<<< HEAD
	crawl(browser, r, es, neo4j_connector, start_url)

connector.close
=======
	crawl(browser, r, es, neo, link.decode('utf-8'))

neo.close
>>>>>>> b5fc74b (neo)
