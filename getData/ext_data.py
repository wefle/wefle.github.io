import xlrd
import numpy as np
import requests 
from bs4 import BeautifulSoup 
import xlsxwriter
import re
import utm

DATA_FILE = "HWN_2021_11_15.xls"
WS_SONDERSTMPL = "https://www.harzer-wandernadel.de/stempelstellen/sonderstempel/"

#set up excel table
workbook = xlsxwriter.Workbook('output/stempel.xlsx')
worksheet = workbook.add_worksheet('stamps')
worksheet.write('A1', 'stamp_name')
worksheet.write('B1', 'latitude')
worksheet.write('C1', 'longitude')
worksheet.write('D1', 'special')
worksheet.write('E1', 'sightseeing')
worksheet.write('F1', 'trivia')

row = 1

def save_data(infos, special):
    #name
    worksheet.write(row, 0, infos[0])
    if len(infos) > 1: 
        i = 1
        if not isinstance(infos[i], str):
            #longitude and latitude
            s_lat = s_lng = ''
            while i < len(infos) and not isinstance(infos[i], str):
                s_lat += str(infos[i][0]) + ' | '
                s_lng += str(infos[i][1]) + ' | '
                i += 1
            worksheet.write(row, 1, s_lat)
            worksheet.write(row, 2, s_lng)
        #trivia
        if i < len(infos):
            worksheet.write(row, 5, infos[i])
    #sonderstempel
    worksheet.write(row, 3, special)
    #sehenswürdigkeit
    worksheet.write(row, 4, "nein")

def important_info(elem):
    if(elem.find('(dauer') != -1 or 
       elem.startswith('kosten') or 
       elem.find('N5') != -1     or
       elem.find('N 5') != -1    or
       elem.find('( N') != -1    or
       elem.find('(N') != -1     or
       elem.find('51') != -1     or
       elem.find('32') != -1):
        return True
    else: return False

def important_info_case1(elem):
    if(elem.find('N5') != -1     or
       elem.find('N 5') != -1    or
       elem.find('N') != -1      or
       elem.find('51') != -1     or
       elem.find('32') != -1):
        return True
    else: return False

def important_info_case2(elem):
    if(elem.find('dauer') != -1  or  
       elem.startswith('kosten')):
        return True
    else: return False

def clean_data(dlist):
    if not dlist : return dlist
    else:
        for elem in dlist: 
            if not isinstance(elem, str): continue
            idx = dlist.index(elem)

            #remove unnessessary stuff
            if elem.find(")") != -1:
                if elem[-1] != ")": elem = elem[:elem.find(')')]
                else: elem = elem.replace(')', '')
            if elem.find("(") != -1:
                elem = elem.replace('(', '')
            if elem.find("\xa0") != -1:
                if elem.find('dauer') != -1: 
                    elem = elem.split('\xa0')
                    dlist.pop(idx)
                    dlist = elem + dlist
                    if dlist[0] == '': dlist.pop(0)
                    elem = dlist[idx]
                else: elem = elem.replace('\xa0', '')

            #case 1: info about longitude and latitude
            if important_info_case1(elem):

                #case 1.1: longitude and latitude
                if not elem.find('U') != -1:
                    #split into nessessary components to calculate into latlng
                    char = ''
                    if(elem.startswith('5') and elem.find('N') != -1): char = ' '
                    elif(elem.find('E') != -1): char = 'E'
                    else: char = ' '
                    #get latitude and longitude
                    lat = re.sub('\D', '', elem[:elem.find(char)]) 
                    lng = re.sub('\D', '', elem[elem.find(char):])
                    
                    if lat.startswith('0'): lat = lat[1:]
                    lat = float(lat)/pow(10, int(len(lat))-2)
                    if lng.startswith('0'): lng = lng[1:]
                    lng = float(lng)/pow(10, int(len(lng))-2)

                #case 1.2: utm coordinates
                else:
                    #split into nessessary components to calculate into latlng
                    elem = elem.split(' ')
                    while not elem[0].startswith('32'):
                        elem.pop(0)
                    for i in range(0, len(elem)-1):
                        if(elem[i] != 'U'): elem[i] = re.sub('\D', '', elem[i])
                        if(elem[i] == ''): elem.pop(i)
                    #calculate
                    latlng = utm.to_latlon(int(elem[2]), int(elem[3]), int(elem[0]), elem[1])
                    #get latitude and longitude
                    lat = float(latlng[0])
                    lng = float(latlng[1])

                dlist.pop(idx)
                dlist.insert(idx, [round(lat,5), round(lng,5)])
              
            #case 2: info about trivia
            elif important_info_case2(elem):
                trivia = elem
                if(len(dlist) > 1 and idx+1 <= len(dlist)-1 and 
                   dlist[idx+1].startswith('kosten')):
                    trivia += dlist[idx+1]
                    dlist.pop(idx+1)

                dlist.pop(idx)
                dlist.insert(idx, trivia)
            else: return []
    return dlist   

def remove_duplicate(dlist1, dlist2):
    #mixed dtype -> false
    if((isinstance(dlist1[0], str) and not isinstance(dlist2[0], str)) or
       (not isinstance(dlist1[0], str) and isinstance(dlist2[0], str))):
        return dlist1 + dlist2
    #only string element
    if isinstance(dlist1[0], str) and isinstance(dlist2[0], str):
        if dlist1[0].startswith('dauer') and dlist2[0].startswith('dauer'):
            if dlist1[0].__eq__(dlist2[0]) : return dlist1
            #delete duplicated words
            else:
                l = 0
                dlist1 = list(dlist1[0])
                dlist2 = list(dlist2[0])
            
                if len(dlist1) < len(dlist2):
                    while dlist1:
                        c = dlist1[0]
                        if c.__eq__(dlist2[l]) : 
                            dlist1.pop(0)
                        l += 1
                    if not dlist1:
                        return [''.join(dlist2)]
                else: 
                    while dlist2:
                        c = dlist2[0]
                        if c.__eq__(dlist1[l]) : 
                            dlist2.pop(0)
                        l += 1
                    if not dlist2:
                        return [''.join(dlist1)]
                
                return [''.join(dlist1), ''.join(dlist2)]
    
        else:
            return dlist1 + dlist2
    #only array of float
    else:
        f1 = abs(dlist1[0][0] - dlist2[0][0])
        f2 = abs(dlist1[0][1] - dlist2[0][1])
        if f1 <= 0.0002 and f2 <= 0.0002:
            return dlist1
        else: return dlist1 + dlist2

def remove_red_code(dlist):
    #no duplicates when dlist is empty or has only 1 element
    if(len(dlist) <= 1): return dlist
    else:        
        mid = round(len(dlist)/2)
        #check for different styles and split list accordingly
        if(len(dlist)%2 != 0):
            count = 0
            for elem in dlist:
                if isinstance(elem, str): count += 1 
            if count < len(dlist): mid = count 

        dlist1 = remove_red_code(dlist[:mid])
        dlist2 = remove_red_code(dlist[mid:])

        #delete duplicates and merge 
        return remove_duplicate(dlist1, dlist2)
    
def sorting_infos(elem):
    if isinstance(elem, str): return 1
    else: return 0

def read_excel_file(filename):
    book = xlrd.open_workbook(filename, encoding_override = "utf-8")
    sheet = book.sheet_by_index(0)
    name_data = np.asarray([sheet.cell(i, 1).value for i in range(3, sheet.nrows)])
    pos_data = np.asarray([sheet.cell(i, 2).value for i in range(3, sheet.nrows)])
    return name_data, pos_data

def getting_special_stamps():
    global row

    #get website for info searching
    resp = requests.get(WS_SONDERSTMPL)

    #http_respone 200 means OK status 
    if resp.status_code == 200:
        print("Successfully opened the web page") 

        soup = BeautifulSoup(resp.text, "html.parser")
        content = soup.find("div", {"class":"entry-content"})

    for elem in content.findAll("strong"):
        text = elem.text
        #name of stamp found 
        if(text.startswith('9') or text.startswith('Sonder') or text.startswith('Ur')):
            #remove unnessessary stuff around name
            name = text.split(' ')
            while name[0].startswith('9') or name[0].startswith('Sonder'):
                if name[0].find('HARZ') != -1: name[0] = name[0][name[0].find('HARZ'):]
                else: name.pop(0)
            name = ' '.join(name)
            if name.endswith('\xa0') or name.endswith('\n'): name = name[:-1]

            #search for all infos (p's) between stamp names
            infos = None
            if name.find('32') != -1: 
                infos = [name[name.find('32'):]]
                name = name[:name.find('32')]
            if name.find('(dauer') != -1:
                infos = [name[name.find('(dauer'):]]
                name = name[:name.find('(dauer')]

            info = None
            if elem.nextSibling == None: info = elem.find_next('p') 
            else: info = elem.nextSibling
            if infos == None: infos = []
            while not (info.text.startswith('9') or info.text.startswith('Sonder') or info.text.startswith('Ur') or info.text.find('\xa09') != -1):
                infos.append(info.text)
                if info.nextSibling == None: info = info.find_next('p') 
                else: info = info.nextSibling
                if(info == None): break

            #filter for potential infos -> get longitude, latitude and trivia
            infos = list(filter(important_info, infos))
            #clean data
            infos = clean_data(infos)
            #remove redundant code
            infos = remove_red_code(infos)
            #sort -> lat,lng -> trivia
            infos.sort(key=sorting_infos)
            #add name 
            infos.insert(0, name)
            #save data into excel file
            save_data(infos, 'ja')
            row += 1
    else: 
        print("Error: I couldn't open the website. :'(")

def getting_normal_stamps():
    global row
    #get nessessary data from excel file
    name_data, pos_data = read_excel_file(DATA_FILE)
    
    if len(name_data) == len(pos_data):
        #from and save data into excel file
        for i in range(0, len(name_data)):
            infos = []
            infos.append(name_data[i])
            lat = re.sub('\D', '', pos_data[i][:pos_data[0].find(' ')] ) 
            lng = re.sub('\D', '', pos_data[i][pos_data[0].find(' '):] ) 
            infos.append([float(lat)/pow(10, int(len(lat))-2), float(lng)/pow(10, int(len(lng))-2)])
            save_data(infos, 'nein')
            row += 1

getting_normal_stamps()
getting_special_stamps()

#close and save excel table
workbook.close()