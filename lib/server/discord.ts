interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

interface DiscordEmbed {
    title: string;
    description?: string;
    color?: number;
    fields?: DiscordEmbedField[];
    timestamp?: string;
    footer?: { text: string; icon_url?: string };
}

export async function sendDiscordWebhook(content: string | null, embeds: DiscordEmbed[] = []) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.warn('⚠️ Discord webhook URL not configured');
        return;
    }

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                embeds
            })
        });
        if (!res.ok) {
            console.error(`❌ Discord webhook rejected: HTTP ${res.status}`, await res.text());
            return;
        }
        console.log('✅ Discord notification sent');
    } catch (error: any) {
        console.error('❌ Discord webhook error:', error.message);
    }
}
