import { StreamChat } from 'stream-chat';

type Body = {
  userId?: string;
  name?: string;
  image?: string;
};

function toStreamSafeUserId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9@_-]/g, '_');
}

export async function streamTokenRoute(req: any, res: any) {
  try {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Stream não configurado no servidor.',
      });
    }

    const body: Body = req.body || {};
    const rawUserId = body.userId?.trim();

    if (!rawUserId) {
      return res.status(400).json({
        success: false,
        message: 'userId é obrigatório.',
      });
    }

    const userId = toStreamSafeUserId(rawUserId);
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    // Gera token SEM depender de rede (só usa a secret localmente)
    const token = serverClient.createToken(userId);

    // Opcional: tenta sincronizar user no Stream. Se falhar, não impede login do chat.
    try {
      await serverClient.upsertUsers([
        {
          id: userId,
          name: body.name || rawUserId,
          image: body.image,
        },
      ]);
    } catch (e: any) {
      console.error('Stream upsertUsers falhou:', e?.message || e);
    }

    return res.json({
      success: true,
      message: 'Token gerado com sucesso!',
      token,
    });
  } catch (e: any) {
    console.error('Falha ao gerar token do Stream:', e?.message || e);
    return res.status(500).json({
      success: false,
      message: 'Falha ao gerar token do Stream. Verifique STREAM_API_KEY/STREAM_API_SECRET.',
    });
  }
}


