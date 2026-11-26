import assert from "node:assert/strict";
import { extractMechanicEvidence } from "../engine/mechanic-evidence-extractor";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

const aulus = extractMechanicEvidence(
  "Aulus removes all slow effects and gains Control Immunity.",
);

test("Membedakan penghapusan slow dari pemberian slow", () => {
  assert.ok(aulus.some((item) => item.mechanic === "REMOVE_SLOW"));
  assert.ok(!aulus.some((item) => item.mechanic === "APPLY_SLOW"));
});

test("Mendeteksi Control Immunity secara eksplisit", () => {
  assert.ok(
    aulus.some(
      (item) =>
        item.mechanic === "CONTROL_IMMUNITY" &&
        item.polarity === "PROTECTED",
    ),
  );
});

const hirara = extractMechanicEvidence(
  "She becomes untargetable and immobilized for up to 1s. " +
  "She then deals Physical Damage and performs a joystick dash.",
);

test("Immobilize pada diri sendiri tidak dianggap sebagai CC ofensif", () => {
  const selfImmobilize = extractMechanicEvidence(
    "The hero becomes immobilized for up to 1 second.",
  );
  assert.ok(
    !selfImmobilize.some(
      (item) => item.mechanic === "APPLY_IMMOBILIZE",
    ),
  );
});

test("Immobilize terhadap enemy tetap terdeteksi", () => {
  const enemyImmobilize = extractMechanicEvidence(
    "The skill immobilizes nearby enemies for 1 second.",
  );
  assert.ok(
    enemyImmobilize.some(
      (item) => item.mechanic === "APPLY_IMMOBILIZE",
    ),
  );
});
test("Untargetable tidak disamakan dengan Control Immunity", () => {
  assert.ok(hirara.some((item) => item.mechanic === "UNTARGETABLE"));
  assert.ok(!hirara.some((item) => item.mechanic === "CONTROL_IMMUNITY"));
});

test("Immobilize, dash, dan physical damage terdeteksi terpisah", () => {
  assert.ok(!hirara.some((item) => item.mechanic === "APPLY_IMMOBILIZE"));
  assert.ok(hirara.some((item) => item.mechanic === "DASH"));
  assert.ok(hirara.some((item) => item.mechanic === "PHYSICAL_DAMAGE"));
});

const eudora = extractMechanicEvidence(
  "Eudora deals Magic Damage and stuns the target for 1s.",
);

test("Stun dan Magic Damage terdeteksi", () => {
  assert.ok(eudora.some((item) => item.mechanic === "APPLY_STUN"));
  assert.ok(eudora.some((item) => item.mechanic === "MAGIC_DAMAGE"));
});

const healing = extractMechanicEvidence(
  "The skill recovers HP and grants a shield.",
);

test("Healing dan shield terdeteksi terpisah", () => {
  assert.ok(healing.some((item) => item.mechanic === "HEALING"));
  assert.ok(healing.some((item) => item.mechanic === "SHIELD"));
});

const html = extractMechanicEvidence(
  'Deals <font color="red">True Damage</font> to enemies.',
);

test("HTML dibersihkan tanpa kehilangan evidence text", () => {
  assert.ok(
    html.some(
      (item) =>
        item.mechanic === "TRUE_DAMAGE" &&
        item.evidenceText === "True Damage",
    ),
  );
});

test("Evidence memiliki posisi yang valid", () => {
  for (const item of [...aulus, ...hirara, ...eudora, ...healing, ...html]) {
    assert.ok(item.start >= 0);
    assert.ok(item.end > item.start);
    assert.equal(item.verificationStatus, "UNVERIFIED");
  }
});

const noEvidence = extractMechanicEvidence(
  "The hero gains additional attack speed.",
);

test("Tidak mengarang mekanik dari deskripsi tanpa frasa yang didukung", () => {
  assert.deepEqual(noEvidence, []);
});

const negatedStun = extractMechanicEvidence(
  "The hero is immune to stun effects.",
);

test("Immunity terhadap stun tidak diklasifikasikan sebagai pemberian stun", () => {
  assert.ok(!negatedStun.some((item) => item.mechanic === "APPLY_STUN"));
});

process.stdout.write("\nSemua mechanic evidence tests selesai.\n");