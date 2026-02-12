type FooterProps = {
	activePanel: "queues" | "jobs";
};

export function Footer({ activePanel }: FooterProps) {
	let hints = "tab:panel  q:quit";
	if (activePanel === "queues") {
		hints +=
			"  |  j/k:nav  l/enter:open  a:add  p:pause  d:drain  c:clean  x:del  r:refresh";
	} else {
		hints +=
			"  |  j/k:nav  h/l:filter  enter:inspect  a:add  r:retry  x:del  esc:back";
	}

	return (
		<box paddingLeft={1} paddingRight={1}>
			<text fg="#64748b">{hints}</text>
		</box>
	);
}
