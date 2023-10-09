import pandas as pd
import sqlite3

df = pd.read_csv('ev_stations_v1.csv', low_memory=False)

connection = sqlite3.connect("evStations.db")

table_name = 'stations'

df.to_sql(table_name,connection,if_exists='replace')
connection.commit()
connection.close()