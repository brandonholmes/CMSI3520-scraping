import mechanicalsoup as ms
import redis
import configparser
from elasticsearch import Elasticsearch, helpers

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

def crawl(browser, r, es, url):
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

browser = ms.StatefulBrowser()
r = redis.Redis()

start_url = "https://en.wikipedia.org/wiki/Redis"
r.lpush("links", start_url)

while link := r.rpop("links"):
	if "Jesus" in str(link):
		break
	crawl(browser, r, es, start_url)
