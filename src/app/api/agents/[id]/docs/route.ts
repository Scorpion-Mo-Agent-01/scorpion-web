import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        if (id === "scorpion") {
            const agentsMdPath = path.join(process.cwd(), "AGENTS.md");
            const soulMdPath = path.join(process.cwd(), "SOUL.md");

            const [agentsMd, soulMd] = await Promise.all([
                fs.readFile(agentsMdPath, "utf-8").catch(() => "# No AGENTS.md found"),
                fs.readFile(soulMdPath, "utf-8").catch(() => "# No SOUL.md found"),
            ]);
            return NextResponse.json({ agentsMd, soulMd });
        }

        const agentPath = path.join(process.cwd(), "agents", id);
        const agentsMdPath = path.join(agentPath, "AGENTS.md");
        const soulMdPath = path.join(agentPath, "SOUL.md");

        const [agentsMd, soulMd] = await Promise.all([
            fs.readFile(agentsMdPath, "utf-8").catch(() => "# No AGENTS.md found"),
            fs.readFile(soulMdPath, "utf-8").catch(() => "# No SOUL.md found"),
        ]);

        return NextResponse.json({ agentsMd, soulMd });

    } catch (error: unknown) {
        console.error("Failed to fetch agent docs:", error);
        return NextResponse.json({ error: "Failed to fetch docs" }, { status: 500 });
    }
}
