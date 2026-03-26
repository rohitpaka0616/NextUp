import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import EditIdeaForm from "@/components/EditIdeaForm";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditIdeaPage({ params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;
    const { rows } = await pool.query(
        `SELECT id, title, "shortDesc", "longDesc", "userId"
         FROM "Idea"
         WHERE id = $1`,
        [id]
    );

    if (rows.length === 0) notFound();
    const idea = rows[0] as {
        id: string;
        title: string;
        shortDesc: string;
        longDesc: string;
        userId: string;
    };

    if (idea.userId !== session.user.id) {
        redirect(`/idea/${id}`);
    }

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-2 text-3xl font-bold">Edit Submission</h1>
            <p className="mb-8 text-muted">Update your idea details below.</p>
            <EditIdeaForm
                ideaId={idea.id}
                initialTitle={idea.title}
                initialShortDesc={idea.shortDesc}
                initialLongDesc={idea.longDesc}
            />
        </div>
    );
}
