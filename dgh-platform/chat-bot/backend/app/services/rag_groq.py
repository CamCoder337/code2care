from qdrant_client import QdrantClient
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, AIMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

# Configuration globale
embedder = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

client = QdrantClient(host="localhost", port=6333, grpc_port=6334, prefer_grpc=True)

qdrant_store = QdrantVectorStore(
    client=client,
    collection_name="clinical_summaries",
    embedding=embedder,
    retrieval_mode=RetrievalMode.DENSE,
)

retriever = qdrant_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 20, "lambda_mult": 0.5},
)

llm = ChatGroq(
    model_name="llama-3.1-8b-instant",
    temperature=0.3,
    streaming=False,
)

# Template de prompt avec historique
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """Tu es un assistant médical expert. Utilise le contexte fourni et l'historique de conversation pour répondre de manière précise et contextuelle.

Contexte médical:
{context}

Instructions:
- Réponds en français ou anglais
- Sois précis et professionnel
- Utilise l'historique pour maintenir la cohérence
- Si tu ne sais pas, dis-le clairement"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

# Chaîne de documents
document_chain = create_stuff_documents_chain(llm, prompt_template)
retrieval_chain = create_retrieval_chain(retriever, document_chain)


def ask_question_with_history(question: str, chat_history: list):
    # Convertir l'historique en messages LangChain
    history_messages = []
    for role, content in chat_history:
        if role == "human":
            history_messages.append(HumanMessage(content=content))
        elif role == "ai":
            history_messages.append(AIMessage(content=content))

    # Exécuter la chaîne
    result = retrieval_chain.invoke({
        "input": question,
        "chat_history": history_messages
    })

    return result["answer"], result.get("context", [])


