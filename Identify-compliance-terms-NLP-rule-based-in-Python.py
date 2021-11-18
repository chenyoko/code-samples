# Using a rule-based approach, the following code detects instances of 'investment advice', a term in investment compliance
# Phase one involved a manual mapping the sentences, to develop a list of potential indicators
import pandas as pd

# The indicators in this particular case are such terms that coomunicate consent and confirmation
advices = ['you can', 'we can', 'can go', 'ahead', 'go on', 'move', 'go forward', 'continue', 'carry on', 'take profit', 'proceed'] 
# select text file - please create a text file with the list of true examples
file = open("new.txt", 'r', encoding='UTF-8')
text = file.read()
sentences = []
sentences = text.split('\n')
# create a dataframe to store the results
cols = ['Sentence', 'Score']
df = pd.DataFrame(columns=cols)
for sentence in sentences:
# convert to lowercase
    sentence = sentence.lower()
    score = 0
    for advice in advices:
        if advice in sentence:
            score += 1
        # the words 'invest' and 'offer' were not in the original text provided 
        # However, these words were flagged as potential releveant synonyms through a manual dictionary review
    if (("can" in sentence) or ("you" in sentence)) and (("buy" in sentence) or ("invest" in sentence)):
            score += 1
    if (("provide" in sentence) or ("give" in sentence) or ("offer" in sentence)) and ("advice" in sentence):
            score += 1
    df = df.append({'Sentence': sentence, 'Score': score},ignore_index=True)
# save the results, sorted by score
df = df.sort_values(by=['Score'], ascending=False)
df.to_csv(r'results.csv', index=None)
# print the ratio of scores given to the list of sentences 
# A score of zero suggests that the sentence does not qualify as investment advice
ratios = pd.DataFrame(df['Score'].value_counts()/df['Score'].count()*100)
print(ratios)

# The next step will be to run the script on a general dataset to check for overlaps and false positives and to iterate accordingly
