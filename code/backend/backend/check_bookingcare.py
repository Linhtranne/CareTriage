import urllib.request
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')
try:
    req = urllib.request.Request('https://youmed.vn/bac-si', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    for card in soup.find_all(class_=re.compile('doctor', re.I)):
        print('Card:', card.get_text()[:50])

    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
    if match:
        data = json.loads(match.group(1))
        props = data.get('props', {}).get('pageProps', {})
        
        def find_doctors(obj, results=None):
            if results is None: results = []
            if isinstance(obj, dict):
                if 'name' in obj and ('Bác sĩ' in str(obj['name']) or 'BS' in str(obj['name']) or 'Phó' in str(obj['name']) or 'Giáo sư' in str(obj['name'])):
                    results.append(obj)
                for k, v in obj.items():
                    find_doctors(v, results)
            elif isinstance(obj, list):
                for i in obj:
                    find_doctors(i, results)
            return results
            
        docs = find_doctors(props)
        print(f'Found {len(docs)} doctors in Next Data')
        # filter out duplicates by name
        unique = {d['name']: d for d in docs}.values()
        for d in list(unique)[:5]:
            print("Name:", d.get('name'))
            print("Specialty:", d.get('specialtyData', {}).get('name', 'N/A') if isinstance(d.get('specialtyData'), dict) else 'N/A')
            print("Clinic:", d.get('clinicData', {}).get('name', 'N/A') if isinstance(d.get('clinicData'), dict) else 'N/A')
            print("---")
except Exception as e:
    print('Error:', e)
