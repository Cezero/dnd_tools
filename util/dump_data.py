import mysql.connector
import os
import argparse
from dotenv import load_dotenv

queries = {
    "source_query": """
        SELECT sb.id, sb.name, sb.abbreviation, sb.editionId,
            IF((SELECT COUNT(*) FROM SpellSourceMap ssm WHERE ssm.sourceBookId = sb.id) > 0, 'true', 'false') AS hasSpells,
            IF((SELECT COUNT(*) FROM ClassSourceMap csm WHERE csm.sourceBookId = sb.id) > 0, 'true', 'false') AS hasClasses
        FROM SourceBook sb
    """,
    "class_query": """
        SELECT cl.id, cl.name, cl.abbreviation, cl.editionId, cl.display, cl.canCast, cl.isPrestige
        FROM Class cl
    """,
    "spell_query": """
        SELECT sp.id, sp.name, sp.editionId FROM Spell sp
    """
}

parser = argparse.ArgumentParser(description="Dump data from the database.")
parser.add_argument(
    "--query",
    type=str,
    help="Name of query to run",
    default=None # Will be handled by load_config
    )
args = parser.parse_args()

load_dotenv()

conn = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            database=os.getenv('DB_NAME')
)

cursor = conn.cursor(dictionary=True)
cursor.execute(queries[args.query])

rows = cursor.fetchall()
cursor.close()
conn.close()

print("export const SOME_DATA = {")
for i, row in enumerate(rows, start=1):
    entry = ", ".join(f"{k}: {repr(v)}" for k, v in row.items())
    print(f"    {i}: {{ {entry} }},")
print("};")

