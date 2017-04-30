import json

filename = "aps-citations_cleaned.mtx_34_IMPR_circle.json"
#filename = "aps-citations_cleaned.mtx_23_IMPR_circle.json"

kwfilename = "keywords_34.json"


with open("original/"+filename) as file:
	data = json.load(file)

with open("original/"+kwfilename) as file:
	keywords = json.load(file)


def update(data):
	if len(data['name']) != 0:

		del data['fl']
		data['den'] = data['color']/4
		del data['color']
		#data['den'] = float(data['name'].split(' ')[1])
		data['k'] = int(data['name'].split(' ')[2][1:-1])
		del data['name']


		words = keywords[data['index']]['common_words']
		auths =  keywords[data['index']]['common_authors']

		if len(words) > 0:
			data['cp'] = words[0][0]
		else:
			data['cp'] = "No data"

		if len(auths) > 0:
			data['ca']  = auths[0][0]
		else:
			data['ca']  = "No data"
		

		#data['cp'] = keywords[data['index']]['common_words'][0]#"placeholder word"
		#data['ca'] = keywords[data['index']]['common_authors'][0]#"placeholder author"

		if 'children' in data:
			for child in data['children']:
				update(child)
	else:
		#I guess these nameless nodes were why the fl field was checked for
		#they all have size 1 so are ignored anyways
		del data['fl']
		del data['color']
		del data['name']
		#data['cp'] = ''
		data['size'] = -1

		'''
		del data['fl']
		data['den'] = data['color']/4
		del data['color']
		#data['den'] = float(data['name'].split(' ')[1])
		#data['k'] = int(data['name'].split(' ')[2][1:-1])
		del data['name']

		data['cp'] = "word BROKEN"
		data['ca'] = "author BROKEN"

		print data
		'''


print "Original fields:"
for key, val in data.iteritems():
	print key


update(data)

print "\nUpdated fields:"
for key, val in data.iteritems():
	print key

with open(filename, 'w') as outfile:
    json.dump(data, outfile)

#print data
