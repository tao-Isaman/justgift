// Transparent background so OBS composites the overlay over the stream.
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`html,body{background:transparent !important;}`}</style>
      {children}
    </>
  );
}
