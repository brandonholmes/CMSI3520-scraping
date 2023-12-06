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


def write_to_elastic(es, url, html):
	es.index(
		index='webpages',
		document={
			'url': url,
			'html': html
		}
	)

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

start_url = "https://en.wikipedia.org/wiki/Redis"
r.lpush("links", start_url)

while link := r.rpop("links"):
	if "Jesus" in str(link):
		break
	crawl(browser, r, es, neo4j_connector, start_url)

connector.close
