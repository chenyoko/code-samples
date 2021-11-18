# Automatic slide generator in any language, receive text and identify the headline for the slide and select background image/icon

import nltk
nltk.download('punkt')
from nltk.tokenize import word_tokenize
import re
from googletrans import Translator 
import spacy
from spacy.matcher import Matcher
nlp = spacy.load("en_core_web_sm")

# For each sentence - extract the topic for the headline based on tokenization and rank system 
def tokenize(text):
    lda_tokens = []
    tokens = nlp(text)
    count = 0
    root = 0
    next_i = 0
    for i, token in enumerate(tokens):
        # skip the spaces
        if token.orth_.isspace():
            continue
        else:
            next_i = (i + 1) % len(tokens)
            # MARK THE ROOT OF THE SENTENCE, excluding the last three words - this can be marked by various indictors
            if (token.dep_ == "ROOT" or token.dep_ == "xcomp" or (token.pos_ == "VERB" and (tokens[next_i].text == "a" or tokens[next_i].text == "an"))) and (i < int(len(tokens)*0.8)):
                root = 1
                lda_tokens = []
                count = 0
                # add the word before the mark if releveant, such as negatives or adjectives
                if i>0:
                    if tokens[i-1].dep_ == 'neg' or tokens[i-1].pos_ == 'ADJ' or tokens[i-1].text == 'the':
                        lda_tokens.append(tokens[i-1].text)
                        count += 1
            # KNOW WHEN TO END THE TOPIC FOR CERTAIN DEPENDENCIES 
            if root != 0 and token.dep_ == "prep" and tokens[next_i].dep_ == "det":
                count = 4
            # mark end of sentence for question mark, exclamation mark, semicolon, colon, elipsis
            if token.text == ":" or token.text == ";" or token.text == "?" or token.text == "!" or token.text == "…":
                break    
            # after the initial tests above, we start to add tokens to the topic
            # first indicator of the topic - START THE TOPIC FROM a subordinating conjunction like 'that' or 'if' when followed by a noun or adjective (this is one of two indicators and the stronger of the two, the second being 'the first noun after the root' used below)
    #####[---- Redacted ------]#####
    return lda_tokens

# check for certain punctuation marks at the start of the sentence and if so truncate and return only the start as the topic
def dash(text):
    dashtopic = text
    puncts = [" -","- "," –","– ",":",";","!"]
    # loop through the first five tokens searching for certain 
    for punct in puncts:
        if punct in text:
            # if one of the punctuations is found, compare first and second part of the sentemce and take the first part if it's shorter
            first = text.split(punct,1)[0]
            firstwordcount = len(word_tokenize(first))
            second = text.split(punct,1)[1]
            secondwordcount = len(word_tokenize(second))
            if firstwordcount<secondwordcount:
                dashtopic = text.split(punct,1)[0]

    return dashtopic

# For each sentence - find the one word that produces the icon image to used in the slide
def iconize(text):
    icon = ""
    tokens = nlp(text)
    next_i = 0
    iconclass = 0
    for i, token in enumerate(tokens):
        next_i = (i + 1) % len(tokens)
    #####[---- Redacted ------]#####
    return icon

# select text file - please replace with the source of text
text_file = open("new.txt", encoding="utf8")
dest_lang = text_file.read()
# clean the text, removing text within brackets etc.
#####[---- Redacted ------]#####
# split the text into a list of sentences, filtering out irrelevant values  
sentences = re.split('(?<=[.!?;])|[\n]',dest_lang)
sentences = list(filter(lambda x : len(x) > 2, sentences))
# initate translator
translator = Translator()
detected = Translator().detect(dest_lang).lang
# For each sentence extract the suggested topic and icon
for j, dest_langsent in enumerate(sentences):
    # translate the complete text
    result = translator.translate(dest_langsent, src='he', dest='en')
    sent = result.text
    # number of WORDS in original sentence
    origclean = re.sub(r'[^\w\s]','',dest_langsent)
    origwordcount = len(word_tokenize(origclean))
    # check and return the the first half of the sentence for certain punctuation marks 
    dashed = dash(sent)
    # number of WORDS in English sentence
    dashwordcount = len(word_tokenize(dashed))
    # find the topic of the sentence; however, if the sentence is already short then return the sentence 'as is'
    if (origwordcount>3 and dashwordcount>3):
        tokens = tokenize(dashed)
        tokens = ' '.join(tokens)
        if detected == 'he':
            topic = translator.translate(tokens, src='en', dest='he').text
        else:
            topic = tokens
    elif (origwordcount>3 and dashwordcount<5):
        topic = dashed
    else:
        topic = dest_langsent

    # remove dots and commas fromm the topic
    topic = topic.replace('.', '')
    topic = topic.replace(',', '')
    # print the result - topic and icon
    print ("\n" + "Sentence: ", j+1)
    print("Topic: ", topic)
    print("Icon: ", iconize(sent))
    print (sent)