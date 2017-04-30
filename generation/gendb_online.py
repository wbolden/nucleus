import json


mapfile_path = '../map.txt'
fakedb_path = '../aps-citations_cleaned.mtx_34_IMPR_fakedb'
metadata_path = '../aps-dataset-metadata-2013'
output_path = 'output'


folderhash = {};
folderhash["PhysRev"] = "PR";
folderhash["PhysRevA"] = "PRA";
folderhash["PhysRevB"] = "PRB";
folderhash["PhysRevC"] = "PRC";
folderhash["PhysRevD"] = "PRD";
folderhash["PhysRevE"] = "PRE";
folderhash["PhysRevSeriesI"] =  "PRI";
folderhash["PhysRevLett"] = "PRL";
folderhash["PhysRevSTAB"] = "PRSTAB";
folderhash["PhysRevSTPER"] = "PRSTPER";
folderhash["PhysRevX"] = "PRX";
folderhash["PhysRevA"] = "PRA";
folderhash["RevModPhys"] = "RMP";
#There are a few more conversion I would need to do (see errors)
#but since we don't actually have the files for those I'm ignoring 
#them for the moment

# Build the mapfile

mapfile = {}
doifile = {}

with open(mapfile_path) as df:
	for line in df:

		try:
			line = line.split("\t")

			if line[0] == 'doi':
				continue

			line[1] = int(line[1])
			
			doi = line[0]

			doifile[line[1]] =  doi
		except Exception as err:
			print "No folder for key:",err, line

			#mapfile[line[1]] = str(err) + "(ERROR!)"

			
with open(mapfile_path) as df:
        for line in df:

                try:
                        line = line.split("\t")

                        if line[0] == 'doi':
                                continue

                        line[1] = int(line[1])


                        doi = line[0].split('/')[1]
                        subfolders = doi.split('.')
                        subfolders[0] = folderhash[subfolders[0]]
                        subfolders[2] = doi

                        mapfile[line[1]] =  ("/".join(subfolders))+".json"
                except Exception as err:
                        print "No folder for key:",err, line

                        #mapfile[line[1]] = str(err) + "(ERROR!)"


papercache = {}

# function to get the paper data
# returns dict


import urllib2 as url
import bibtexparser


def get_paper_online(paper_index):

        #print "this got called"
	if paper_index in papercache:
		return papercache[paper_index]


        #print paper_index
       # print doifile[paper_index]
       # print "sdfsdfsdfsdfdfdf"
        
	path = "https://journals.aps.org/pr/export/"+doifile[paper_index]

        print "requesting %s" %(path)

	response = url.urlopen(path)
	html = response.read()

	bd = bibtexparser.loads(html)

	data = bd.entries[0]

        data['authors'] = [ "".join(x.split(',')[::-1]) for x in data['author'].split('and')]
        data['date'] = "%s %s" % (data['month'], data['year'])

        
        ##print data
        
	#papercache[paper_index] = data

	return data

def get_paper(paper_index):

        if paper_index in papercache:
                return papercache[paper_index]

        path = metadata_path+"/"+mapfile[paper_index]

        try:
                with open(path) as dataf:
                        data = json.load(dataf)
                        data['title'] = data['title']['value']
                        data['authors'] = [author['name'] for author in data['authors']]
        except:
                print "Failed to open %s, loading from online" %(path)
                data =  get_paper_online(paper_index);
                #print "Retrieved: ", data

        papercache[paper_index] = data

        return data


#Removes irrelevant words from the provided dictionary
def remove_irrelevant(dict):
   	words =  ['and','that','but','or','as','if','when','than',
	'because','while','where','after','so','though',
	'since','until','whether','before','although','to',
	'nor','like','once','unless','now','except','at',
	'the','of','on','an','in','with','a','for','from',
	'between','study','some','due','we','You','The',
	'A','Their', 'by'];

	for word in words:
		if word in dict:
    			del dict[word];
  
  	return dict;



#authors[n].name
#date
#title.value

import re
regex = re.compile("\<(.*?)\>")
#result = re.sub(regex,"",data[3]['title'])

all_kw = {}

def write_info(set_index, paper_index_array):
	common_words = {}
	common_authors = {}

	papers = []

	for index in paper_index_array:
		try:
			paper = get_paper(index)

			title = paper['title']
			date = paper['date']
			authors = [author for author in paper['authors']]

			for author in authors:
				if author in common_authors:
					common_authors[author]+=1
				else:
					common_authors[author]=1



			for word in re.sub(regex,"",title).split(' '):
				if word in common_words:
					common_words[word]+=1
				else:
					common_words[word]=1

			
			relevant_info = {}
			relevant_info['title'] = title
			relevant_info['authors'] = authors
			relevant_info['date'] = date

			papers.append(relevant_info)
			

			#print title

			#maybe add this
			#affiliation = 
		except Exception as err:
			print err

	common_words = remove_irrelevant(common_words)

	common_words = sorted(common_words.items(), key = lambda x: -x[1])
	common_authors =  sorted(common_authors.items(), key = lambda x: -x[1])

	#Keep the 10 most common keywords
	keywords  = {}
	keywords['common_words'] = common_words[0:10]
	keywords['common_authors'] = common_authors[0:10]

	papers_filename = output_path+"/"+str(set_index)+".papers.json"
	keyword_filename = output_path+"/"+str(set_index)+".keywords.json"

	all_kw[set_index] = keywords

	
	with open(papers_filename, 'w') as file:
		json.dump(papers, file)
	

	with open(keyword_filename, 'w') as file:
		json.dump(keywords, file)

	

	#papers["common_words"]
	#papers["common_authors"]


# Load the fakedb

with open(fakedb_path) as df:
	for line in df:
		if line == "info\n":
			continue

		line = [x for x in line.split(" ")]
		index = int(line[0])

		papers = map(int, line[6:-1])

		write_info(index, papers)

with open(output_path+"/keywords.json", 'w') as file:
	json.dump(all_kw, file)
