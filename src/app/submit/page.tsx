import SubmitIdeaForm from "@/components/SubmitIdeaForm";

export default function SubmitPage() {
    return (
        <section className="mx-auto w-full max-w-3xl py-8">
            <h1 className="mb-2 text-3xl font-bold">Submit Idea</h1>
            <p className="mb-6 text-sm text-muted">
                Share your idea publicly. The community can vote immediately.
            </p>
            <SubmitIdeaForm />
        </section>
    );
}
