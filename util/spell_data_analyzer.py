import csv
import argparse, re
from collections import defaultdict

def make_unique_headers(headers):
    counter = defaultdict(int)
    unique_headers = []
    
    for h in headers:
        if counter[h] == 0:
            unique_headers.append(h)
        else:
            unique_headers.append(f"{h}{counter[h]}")
        counter[h] += 1
    return unique_headers

def parse_csv_to_dicts(file_path):
    data = []
    try:
        with open(file_path, newline='', encoding='cp1252') as csvfile:
            reader = csv.reader(csvfile)
            raw_headers = next(reader)
            headers = make_unique_headers(raw_headers)
            
            for row in reader:
                row_dict = dict(zip(headers, row))
                data.append(row_dict)
        return data
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return []
    except Exception as e:
        print(f'An error occurred: {e}')
        return []

def parse_school_string(val):
    pattern = r'^([^\[\]]+)(?:\[([^\[\]]*)\])?(?:\[([^\[\]]*)\])?\**$'
    match = re.match(pattern, val)
    if match:
        school = match.group(1)
        subschool = match.group(2)
        descriptor = match.group(3)
        return school, subschool, descriptor
    else:
        print(f'ERROR: Invalid Format: "{val}"')
        return ['','','']

def main():
    spell_descriptors = ['acid', 'air', 'chaotic', 'cold', 'darkness', 'death', 'earth', 'electricity', 'evil', 'fear', 'fire', 'force', 'good', 'language-dependent', 'lawful', 'light', 'mind-affecting', 'sonic', 'water', 'see text']
    spell_desc_indx = {desc: i for i, desc in enumerate(spell_descriptors)}
    spell_schools = {
        'uni': {
            'school': 'universal',
            'id': 9
        },
        'inv': {
            'school': 'invocation',
            'subschools': {'least': 14, 'lesser': 15, 'greater': 16, 'dark': 17},
            'id': 10
        },
        'eld': {
            'school': 'invocation',
            'subschools': {'least': 14, 'lesser': 15, 'greater': 16, 'dark': 17},
            'descriptor': {'eldritch essence': 21},
            'id': 10
        },
        'bla': {
            'school': 'invocation',
            'subschools': {'least': 14, 'lesser': 15, 'greater': 16, 'dark': 17},
            'descriptor': {'blast shape': 22},
            'id': 10
        },
        'abj': {
            'school': 'abjuration',
            'id': 1
        },
        'con': {
            'school': 'conjuration',
            'id': 2,
            'subschools': {'calling': 1, 'creation': 2, 'healing': 3, 'summoning': 4, 'teleportation': 5}
        },
        'div': {
            'school': 'divination',
            'id': 3,
            'subschools': {'scrying': 6}
        },
        'en': {
            'school': 'enchantment',
            'id': 4,
            'subschools': {'charm': 7, 'compulsion': 8}
        },
        'evo': {
            'school': 'evocation',
            'id': 5
        },
        'ill': {
            'school': 'illusion',
            'id': 6,
            'subschools': {'figment': 9, 'glamer': 10, 'pattern': 11, 'phantasm': 12, 'shadow': 13}
        },
        'nec': {
            'school': 'necromancy',
            'id': 7
        },
        'tra': {
            'school': 'transmutation',
            'id': 8
        }
        }

    parser = argparse.ArgumentParser(description='Parse a CSV file.')
    parser.add_argument('-f', '--file', help='Path to the CSV file', required=True)
    args = parser.parse_args()
    
    check_column = 'School'
    value_list = []
    records = parse_csv_to_dicts(args.file)
    for record in records:
        if check_column in record:
            not_found = False
            invalid = {}
            val = record[check_column]
            [schools, subschool, descriptor] = parse_school_string(val)
            school_list = schools.split('/')
            for school in school_list:
                if school in spell_schools:
                    if subschool and 'subschools' in spell_schools[school]:
                        if subschool not in spell_schools[school]['subschools']:
                            if not descriptor:
                                descriptor = subschool
                            else:
                                invalid['subschool'] = subschool
                                not_found = True
                    if descriptor:
                        input_desc = descriptor.split(',')
                        invalid_desc = [desc for desc in input_desc if desc not in spell_descriptors]
                        if bool(invalid_desc):
                            invalid['descriptor'] = invalid_desc
                            not_found = True
                else:
                    invalid['school'] = school
                    not_found = True

            if not_found:
                if val not in value_list:
                    value_list.append({val: invalid})
    if value_list:
        for v in value_list:
            print(v)

if __name__ == '__main__':
    main()
