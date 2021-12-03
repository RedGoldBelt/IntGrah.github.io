import * as JSB from "https://unpkg.com/jsb-js";
const Note = JSB.Note;
export default Note;
import Vex from "https://unpkg.com/vexflow";

const VF = Vex.Flow;

const bach = new JSB.Piece("A major").parse("[A4|A A (F#/,G#/) A|(B/,A/) G# F#_@|G# A B E4/ F#/|(G#/,A/) F# E@]", "s").parse("[A3|A2 C# D F#|D# E B_@|G# F# E G#/ A/|B B2 E@]", "b").harmonise();
const simple = new JSB.Piece("F# minor").parse("[F#4 F# F# G#|A G# F#_|D F# F# E#|F#__]", "s").harmonise({
    dictionary: JSB.Dict.PRIMARY_A
});
const anthem = new JSB.Piece("G major").parse("[G4 G A|F#. G/ A|B@ B C|B. A/ G|A G F#|G_.@]", "s").harmonise();
const hark = new JSB.Piece("G major").parse("[D G G. F#/|G@ B B A@|D D C_|B A B_@]", "s").harmonise();

function convert(note, part) {
    const clef = part === "s" || part === "a" ? "treble" : "bass";
    const stem = part === "s" || part === "t" ? 1 : -1;
    const vfNote = new VF.StaveNote({
        clef: clef,
        keys: [`${JSB.BasicTone.LETTERS[note.letter]}/${note.octave}`],
        duration: {
            "0.25": "16",
            "0.5": "8",
            "0.75": "8",
            "1": "q",
            "1.5": "q",
            "2": "h",
            "3": "h",
            "4": "1"
        } [note.duration],
        stem_direction: stem
    });
    if (note.accidental !== 0) {
        vfNote.addAccidental(0, new VF.Accidental(JSB.BasicTone.ACCIDENTALS[note.accidental]));
    }
    if ([0.75, 1.5, 3].includes(note.duration)) {
        vfNote.addDot(0);
    }
    return vfNote;
}

const factory = new Vex.Flow.Factory({
    renderer: {
        elementId: "output",
    }
});

function render(piece) {
    let x = 40;

    factory.getContext().clear();
    factory.getContext().resize(100000, 240);

    for (let i = 0; i < piece.bars.length; ++i) {
        const s = [];
        const a = [];
        const t = [];
        const b = [];

        const bar = piece.bars[i];

        for (let e = 0; e < bar.length; ++e) {
            s.push(...bar[e].s.notes.map(note => convert(note, "s")));
            a.push(...bar[e].a.notes.map(note => convert(note, "a")));
            t.push(...bar[e].t.notes.map(note => convert(note, "t")));
            b.push(...bar[e].b.notes.map(note => convert(note, "b")));
        }

        let width = 60 * piece.bars[i].map(event => event.duration).reduce((l, r) => l + r);

        if (i === 0) {
            width += 80;
        }

        const system = factory.System({
            x: x,
            y: 0,
            width: width,
            spaceBetweenStaves: 10
        });

        x += width;

        const score = factory.EasyScore();

        const vfKey = piece.key.tonality ? piece.key.tone.string : piece.key.degree(2).string;

        let upper = system.addStave({
            voices: [
                score.voice(s).setStrict(false),
                score.voice(a).setStrict(false)
            ]
        });

        let lower = system.addStave({
            voices: [
                score.voice(t).setStrict(false),
                score.voice(b).setStrict(false)
            ]
        });

        if (i === 0) {
            upper.addClef("treble").addKeySignature(vfKey);
            lower.addClef("bass").addKeySignature(vfKey);
            system.addConnector("brace");
            system.addConnector("singleLeft");
        }

        system.addConnector(i === piece.bars.length - 1 ? "boldDoubleRight" : "singleRight");

        factory.draw();
    }
    factory.getContext().resize(x + 40, 240);
}

render(bach);