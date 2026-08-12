export type TransitionIdentity = {
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

export type TransitionFieldsProps = {
  visitId: string;
  identity: TransitionIdentity;
  planningVersion?: number;
};

export default function TransitionFields({ visitId, identity, planningVersion }: TransitionFieldsProps) {
  return (
    <>
      <input type="hidden" name="visit_id" value={visitId} />
      {planningVersion === undefined ? null : <input type="hidden" name="expected_version" value={planningVersion} />}
      <input type="hidden" name="idempotency_key" value={identity.idempotencyKey} />
      <input type="hidden" name="correlation_id" value={identity.correlationId} />
    </>
  );
}
