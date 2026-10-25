#!/usr/bin/env python3
"""Search and read a reference book PDF with correct PRINTED page numbers.

Why: the PDF-to-printed page offset drifts inside scanned books (missing or inserted pages), so a fixed offset gives wrong
citations. This tool reads each page's own header/footer number and reconciles it with its neighbours.

  book-search.py <book.pdf> find "regex" [--max 40] [--context 90]   list pages containing a match
  book-search.py <book.pdf> show 140 [--to 142] [--printed]           print pages (numbers are PDF pages, or printed with --printed)
  book-search.py <book.pdf> map                                        print the pdf->printed page table (for checking)

Needs poppler (pdftotext). Text of a scanned book is OCR: check numbers and units against the page image before recording them
(pdftoppm -jpeg -r 110 -f N -l N book.pdf /tmp/p).
"""
import re, sys, os, subprocess, hashlib, statistics, json

def load(pdf):
    key = hashlib.md5((os.path.abspath(pdf) + str(os.path.getsize(pdf))).encode()).hexdigest()[:10]
    cache = f"/tmp/bookcache-{key}.json"
    if os.path.exists(cache): return json.load(open(cache))
    txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, errors="ignore").stdout
    pages = txt.split("\f")
    if pages and not pages[-1].strip(): pages = pages[:-1]
    cands = []
    for t in pages:
        lines = [l.strip() for l in t.split("\n") if l.strip()]
        c = []
        for l in lines[:2] + lines[-2:]:
            for m in (re.match(r"^(\d{1,3})\b", l), re.search(r"\b(\d{1,3})$", l)):
                if m: c.append(int(m.group(1)))
        cands.append(sorted(set(c)))
    # reconcile: offset (pdf - printed) should match the local median of unambiguous neighbours
    offs = []
    for i, c in enumerate(cands):
        offs.append([(i + 1) - n for n in c if 1 <= n <= len(pages)])
    printed = [None] * len(pages)
    for i in range(len(pages)):
        near = [o for j in range(max(0, i - 12), min(len(pages), i + 13)) for o in offs[j]]
        if not near: continue
        # most common offset in the window
        best = max(set(near), key=near.count)
        for n in cands[i]:
            if (i + 1) - n == best: printed[i] = n
    json.dump({"pages": pages, "printed": printed}, open(cache, "w"))
    return {"pages": pages, "printed": printed}

def pp(d, i):  # i = 0-based
    p = d["printed"][i]
    return f"pdf p{i+1}" + (f" (printed p. {p})" if p else " (printed no. unclear)")

def main():
    if len(sys.argv) < 3: print(__doc__); sys.exit(2)
    pdf, cmd = sys.argv[1], sys.argv[2]; d = load(pdf); args = sys.argv[3:]
    opt = lambda n, dflt: (args[args.index("--" + n) + 1] if ("--" + n) in args else dflt)
    if cmd == "find":
        rx = re.compile(args[0], re.I); ctx = int(opt("context", 90)); mx = int(opt("max", 40)); n = 0
        for i, t in enumerate(d["pages"]):
            flat = re.sub(r"\s+", " ", t)
            ms = list(rx.finditer(flat))
            if not ms: continue
            m = ms[0]; s = flat[max(0, m.start() - ctx): m.end() + ctx]
            print(f"{pp(d, i)}  x{len(ms)}: ...{s}...")
            n += 1
            if n >= mx: print("(more hits not shown; raise --max)"); break
        if n == 0: print("no matches")
    elif cmd == "show":
        a = int(args[0]); b = int(opt("to", a))
        if "--printed" in args:  # args numbers are printed pages
            idx = [i for i in range(len(d["pages"])) if d["printed"][i] and a <= d["printed"][i] <= b]
        else: idx = list(range(a - 1, b))
        for i in idx:
            print(f"\n===== {pp(d, i)} =====\n" + re.sub(r"\n\s*\n+", "\n", d["pages"][i]).rstrip())
    elif cmd == "map":
        print(json.dumps({i + 1: p for i, p in enumerate(d["printed"]) if p}, indent=0)[:6000])
    else: print(__doc__); sys.exit(2)
main()
