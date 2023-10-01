import mechanicalsoup
import pandas as pd
import sqlite3

url = "https://en.wikipedia.org/wiki/2023_in_video_games"
browser = mechanicalsoup.StatefulBrowser()
browser.open(url)

td = browser.page.find_all("td")
columns = [value.text.replace("\n", "") for value in td]
columns = columns[7:151]

column_names = ["Developer",
                "Publisher",
                "Release", 
                "Platform",
                "AverageScore"]

data = []

for i in range(0, len(columns), 6):
    data.append(columns[i:i+6])

connection = sqlite3.connect("videogames.db")
cursor = connection.cursor()
cursor.execute("create table games (Title, " + ",".join(column_names) + ")")

for i in range(len(data)):
    cursor.execute("insert into games values(\"" + data[i][0] + "\",\"" + data[i][1] + "\",\"" + data[i][2] + "\",\"" + data[i][3] + "\",\"" + data[i][4] + "\",\"" + data[i][5] + "\")")

connection.commit()

connection.close()