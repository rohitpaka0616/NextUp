"use client";

import SubmitIdeaForm from "@/components/SubmitIdeaForm";

export default function SubmitPage() {
    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-2 text-3xl font-bold">Submit Your Idea</h1>
            <p className="mb-8 text-muted">
                Pitch an idea. Let the community vote. We’ll build the winner.
            </p>
            <SubmitIdeaForm />
        </div>
    );
}
