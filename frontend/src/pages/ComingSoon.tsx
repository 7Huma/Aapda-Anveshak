type Props = {
  title: string;
  note: string;
};

function ComingSoon({ title, note }: Props) {
  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>{title}</h1>
        <p>{note}</p>
      </header>
    </main>
  );
}

export default ComingSoon;