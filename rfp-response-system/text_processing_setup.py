import nltk

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    print("Downloading punkt tokenizer...")
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    print("Downloading stopwords corpus...")
    nltk.download('stopwords')

try:
    nltk.data.find('tokenizers/punkt_tab/english.pickle') # Check for the English punkt_tab
except LookupError:
    print("Downloading punkt_tab (language data)...")
    nltk.download('punkt_tab')

print("NLTK resources downloaded successfully.")

# Example usage (optional):
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

text = "This is a sample sentence, showing off the stop words filtration."
tokens = word_tokenize(text)
stop_words = set(stopwords.words('english'))
filtered_tokens = [word for word in tokens if word.lower() not in stop_words]

print("Original tokens:", tokens)
print("Filtered tokens:", filtered_tokens)