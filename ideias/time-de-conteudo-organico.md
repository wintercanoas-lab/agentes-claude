# 💡 Ideia guardada: Time de Conteúdo Orgânico (Instagram + Página)

> Status: **para fazer depois**. Combinado em 15/10/2026.

## Por quê
- O perfil do Instagram e a página estão pouco movimentados.
- O algoritmo da Meta **não exige** posts para rodar anúncios, mas **quem vê o anúncio visita o perfil antes de comprar**. Um perfil vazio passa desconfiança e desperdiça o clique pago. Um perfil com vida faz o mesmo anúncio converter mais.
- "Aquecer" a **conta de anúncios** é outra coisa: começar com orçamento baixo, subir aos poucos e manter o pagamento em dia (papel do Buck 💰).
- Os 6 agentes atuais cuidam só do **pago**. Nenhum olha posts, seguidores, bio ou calendário.

## Agentes propostos
| Agente | O que faz |
|---|---|
| 🪞 **Vitrine** | Revisa o perfil como um cliente desconfiado: bio, foto, destaques, posts fixados e link. Entrega uma lista do que arrumar. |
| 📅 **Agenda** | Calendário semanal de posts: dia, formato (Reels, carrossel, stories) e assunto. |
| ✍️ **Pena** | Legendas, roteiros de Reels e sequências de stories. |
| 📈 **Lupa** | Lê os números do Instagram e da página (alcance, salvamentos, seguidores) e diz o que repetir. |
| 📤 **Carteiro** | Publica ou agenda os posts **com a trava de segurança**: mostra o post pronto e só publica depois do "sim". |

**Integração com o time pago:** a Lupa acha o post que performou bem de graça, e o Buck e a Ada o transformam em anúncio.

**Limites:** os agentes não gravam vídeo nem tiram foto. O usuário grava, com roteiro pronto.

## O que vai ser preciso
- Novas permissões no token: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement` e, para o Carteiro, `instagram_content_publish` e `pages_manage_posts`. Talvez seja preciso adicionar o caso de uso "Gerenciar mensagens e conteúdo no Instagram" ao app, ou criar um segundo app, porque alguns casos de uso não se combinam.
- Respostas do usuário:
  1. O que vende ou divulga?
  2. Quem é o cliente ideal (idade, região, o que procura)?
  3. Quer que o Carteiro publique sozinho, com trava, ou só entregue tudo pronto?

## Também na fila
- Melhorias nos 6 agentes atuais: tirar os dados de outra conta da Cleo, ROAS de equilíbrio pela margem, fase de aprendizado, taxa de gancho e retenção, API mais nova, leads e WhatsApp.
- Agentes novos do time pago: Espião de concorrentes (Biblioteca de Anúncios), Estrategista de público, Detetive do pixel, Montador de campanhas (cria tudo PAUSADO, com trava).
- Resumo diário automático das campanhas.
