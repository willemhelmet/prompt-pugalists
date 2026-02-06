import { useParams } from "wouter";

export function CharacterEdit() {
  const { id } = useParams<{ id: string }>();

  // TODO: fetch character by id and populate form (reuse CharacterCreate form)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-4">Edit Character</h2>
      <p className="text-gray-400">Character ID: {id}</p>
      <p className="text-gray-500 mt-4">TODO: reuse character creation form</p>
    </div>
  );
}
