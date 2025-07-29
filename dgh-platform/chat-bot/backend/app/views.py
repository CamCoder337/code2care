from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ChatRequestSerializer
from .models import Conversation, ChatMessage
from .services.rag_groq import ask_question_with_history, get_qdrant_status
from .utils import qdrant, embed_model, get_qdrant_info


class ChatAPIView(APIView):
    def post(self, request):
        s = ChatRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        q = s.validated_data["message"]

        # Vérifier la disponibilité des services
        if not qdrant:
            return Response({
                "error": "Service Qdrant non disponible",
                "qdrant_status": get_qdrant_info()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        conv = Conversation.objects.create()
        ChatMessage.objects.create(conversation=conv, role="user", content=q)

        try:
            vec = embed_model.encode([q])[0].tolist()
            hits = qdrant.search("clinical_summaries", query_vector=vec, limit=3)
            ctx = " ".join(h.payload["content"] for h in hits)

            messages = [
                {"role": "system", "content": f"Contexte médical : {ctx}"},
                {"role": "user", "content": q},
            ]
            res = openai_client.chat.completions.create(
                model="meta-llama/Llama-3.2-3B-Instruct",
                messages=messages,
                max_tokens=150
            )
            ans = res.choices[0].message.content

            ChatMessage.objects.create(conversation=conv, role="assistant", content=ans)

            # Ajouter info sur le mode Qdrant utilisé
            qdrant_info = get_qdrant_info()

            return Response({
                "answer": ans,
                "qdrant_mode": qdrant_info.get("mode", "unknown"),
                "conversation_id": conv.id
            })

        except Exception as e:
            return Response({
                "error": f"Erreur lors du traitement: {str(e)}",
                "qdrant_status": get_qdrant_info()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatGroqAPIView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data["message"]
        conv_id = request.data.get("conversationId")

        # Vérifier le statut Qdrant
        qdrant_status = get_qdrant_status()
        if qdrant_status["status"] != "connected":
            return Response({
                "error": "Service Qdrant non disponible",
                "qdrant_status": qdrant_status
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Utiliser une transaction pour garantir la cohérence
        try:
            with transaction.atomic():
                # 1. Récupérer ou créer conversation
                if conv_id:
                    try:
                        conv = Conversation.objects.get(id=conv_id)
                    except Conversation.DoesNotExist:
                        conv = Conversation.objects.create()
                else:
                    conv = Conversation.objects.create()

                # 2. Récupérer l'historique COMPLET depuis la DB (source unique de vérité)
                existing_messages = ChatMessage.objects.filter(
                    conversation=conv
                ).order_by("timestamp")

                # 3. Construire l'historique pour LangChain
                chat_history = []
                for msg in existing_messages:
                    if msg.role == "user":
                        chat_history.append(("human", msg.content))
                    elif msg.role == "assistant":
                        chat_history.append(("ai", msg.content))

                # 4. Enregistrer la nouvelle question utilisateur
                user_message = ChatMessage.objects.create(
                    conversation=conv,
                    role="user",
                    content=question
                )

                # 5. Appeler le RAG avec l'historique complet
                answer, sources = ask_question_with_history(question, chat_history)

                # 6. Enregistrer la réponse
                assistant_message = ChatMessage.objects.create(
                    conversation=conv,
                    role="assistant",
                    content=answer
                )

                # 7. Récupérer l'historique final mis à jour
                final_messages = ChatMessage.objects.filter(
                    conversation=conv
                ).order_by("timestamp")

                messages_data = [
                    {
                        "role": m.role,
                        "content": m.content,
                        "timestamp": m.timestamp.isoformat()
                    }
                    for m in final_messages
                ]

                return Response({
                    "answer": answer,
                    "sources": [{"content": doc.page_content, "metadata": doc.metadata} for doc in sources],
                    "conversationId": conv.id,
                    "messages": messages_data,
                    "total_messages": len(messages_data),
                    "qdrant_mode": qdrant_status["mode"],
                    "qdrant_url": qdrant_status.get("url", "unknown")
                })

        except Exception as e:
            return Response({
                "error": f"Erreur lors du traitement: {str(e)}",
                "qdrant_status": get_qdrant_status()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QdrantStatusAPIView(APIView):
    """Endpoint pour vérifier le statut de Qdrant"""

    def get(self, request):
        qdrant_status = get_qdrant_status()
        utils_info = get_qdrant_info()

        return Response({
            "rag_service": qdrant_status,
            "utils_service": utils_info,
            "timestamp": "2025-01-29T12:00:00Z"  # Vous pouvez utiliser timezone.now()
        })