export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">KI Chat</h2>
      <p className="text-gray-500 text-sm">
        Chat mit Projektkontext (Normen + letzte Analyse).
        Wird in Schritt 7 implementiert.
      </p>
    </div>
  );
}
