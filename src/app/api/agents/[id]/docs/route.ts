import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Map agent IDs to directory names
        // agent IDs are like 'agent-scorpion', 'agent-steve-j' but passed as 'scorpion', 'steve-j' in URL usually
        // or the frontend passes the database ID.
        // The database IDs (from migration/seeds) match the directory names generally, but let's be safe.
        // The 'agents' table probably has 'id' as 'scorpion', 'steve-j', etc.

        let agentDir = id;
        if (id === "scorpion") {
            // Scorpion is root
            const agentsMdPath = path.join(process.cwd(), "AGENTS.md");
            const soulMdPath = path.join(process.cwd(), "SOUL.md");

            const [agentsMd, soulMd] = await Promise.all([
                fs.readFile(agentsMdPath, "utf-8").catch(() => "# No AGENTS.md found"),
                fs.readFile(soulMdPath, "utf-8").catch(() => "# No SOUL.md found"),
            ]);
            return NextResponse.json({ agentsMd, soulMd });
        }

        // Other agents are in agents/<id>/
        const agentPath = path.join(process.cwd(), "agents", id);
        const agentsMdPath = path.join(agentPath, "AGENTS.md");
        const soulMdPath = path.join(agentPath, "SOUL.md");

        const [agentsMd, soulMd] = await Promise.all([
            fs.readFile(agentsMdPath, "utf-8").catch(() => "# No AGENTS.md found"),
            fs.readFile(soulMdPath, "utf-8").catch(() => "# No SOUL.md found"),
        ]);

        return NextResponse.json({ agentsMd, soulMd });

    } catch (error: any) {
        console.error("Failed to fetch agent docs:", error);
        return NextResponse.json({ error: "Failed to fetch docs" }, { status: 500 });
    }
}
