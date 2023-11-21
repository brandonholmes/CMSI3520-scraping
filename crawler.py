import mechanicalsoup as ms
import redis
url = "https://lmu.edu"

r = redis.Redis()
b = ms.StatefulBrowser()

def crawl(url, redis_conn, browser):

	print("Opening url")
	browser.open(url)

	print("Extracting links")
	if browser.page:
		aTags = browser.page.find_all("a")

		print("Parsing links")
		hrefs = [ a.get("href") for a in aTags ]

		urlDomain = "https://lmu.edu"

		links = [ urlDomain + a for a in hrefs if a and a.startswith("/") ]
		if links:
			print("Pushing links")
			r.lpush("links", *links)

		print("Total Links: " + str(r.llen("links")))


crawl(url, r, b)
while link := r.rpop("links"):
	crawl(link, r, b)

print("Crawl complete!")
