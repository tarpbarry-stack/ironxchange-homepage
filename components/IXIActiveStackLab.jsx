export default function IXIActiveStackLab({
  title = "ACTIVE STACK",
  children
}) {
  return (
    <section className="ixi-active-stack-lab">
      <button type="button" className="ixi-stack-open-dash" />

      <div className="ixi-stack-tray">
        <button type="button" className="ixi-stack-pocket top-left" />
        <button type="button" className="ixi-stack-pocket top-right" />
        <button type="button" className="ixi-stack-pocket bottom-left" />
        <button type="button" className="ixi-stack-pocket bottom-right" />

        <div className="ixi-stack-command-pad">
          <button type="button" className="ixi-stack-cmd save" />
          <button type="button" className="ixi-stack-cmd theater" />
          <button type="button" className="ixi-stack-cmd board" />
          <button type="button" className="ixi-stack-cmd clear" />
          <button type="button" className="ixi-stack-cmd layout" />
        </div>

        <div className="ixi-stack-label">{title}</div>

        <div className="ixi-stack-card-field">
          {children}
        </div>
      </div>
    </section>
  );
}
