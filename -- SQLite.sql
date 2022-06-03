-- SQLite
CREATE TABLE orderitem (
    id INTEGER PRIMARY KEY,
    name VARCHAR(250),
    itemName VARCHAR(250),
    price VARCHAR(250),
    rating BLOB,
    img VARCHAR(250)
)