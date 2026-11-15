"""The style for matplotlib: load the theme, then finish a figure.

    import sys; sys.path.insert(0, "<skill dir>/scripts")
    import mpl_style

    mpl_style.use()                 # theme and font; call before drawing
    fig, ax = plt.subplots(figsize=(4.4, 2.4))
    ax.bar(names, values)
    ax.set_title("Damage done")
    mpl_style.finish(fig)           # ink rings, outlined title
    fig.savefig("chart.png")

use() returns the font family in use: Expressway where its Bold file is in
assets/fonts, and Fira Sans, the bundled fallback, where it is not. The fonts
ship as woff2, which matplotlib cannot read, so use() converts each once into a
cache directory (this needs fontTools and brotli). Without them text falls back
to matplotlib's default sans and use() says so on stderr.

With Expressway, text is the Regular cut where that is installed on the machine
(its licence forbids bundling it here), and Bold where it is not.
"""
import sys
from dataclasses import replace
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager, patheffects

ASSETS = Path(__file__).resolve().parent.parent / "assets"
CACHE = Path.home() / ".cache" / "style-fonts"
INK = "#000000"
PX = 0.72  # one pixel in points, at the theme's 100 dpi


def _load(stem):
    """Register a font from assets/fonts. Returns whether it loaded."""
    source = next((ASSETS / "fonts" / (stem + ext) for ext in (".ttf", ".otf", ".woff2")
                   if (ASSETS / "fonts" / (stem + ext)).exists()), None)
    if source is None:
        return False
    path = source
    if source.suffix == ".woff2":
        path = CACHE / (stem + ".ttf")
        if not path.exists():
            try:
                from fontTools.ttLib import TTFont
                CACHE.mkdir(parents=True, exist_ok=True)
                font = TTFont(source)
                font.flavor = None
                font.save(path)
            except Exception as error:  # missing fontTools or brotli, or an unreadable file
                print(f"mpl_style: cannot convert {source.name}: {error}", file=sys.stderr)
                return False
    font_manager.fontManager.addfont(str(path))
    return True


def _font():
    """Register the fonts and return the family name, or None when none can be loaded."""
    # Expressway needs its Bold file, as on a page: an installed Regular alone
    # would leave titles without a cut, so Fira Sans sets everything instead.
    if not _load("expressway"):
        return "Fira Sans" if all([_load("fira-sans-400"), _load("fira-sans-700")]) else None
    _load("expressway-xb")
    # An Expressway installed after matplotlib built its font cache is not in the list yet.
    for installed in font_manager.findSystemFonts():
        if "expressway" in Path(installed).name.lower():
            try:
                font_manager.fontManager.addfont(installed)
            except Exception:  # an unreadable file is not worth failing the chart for
                pass
    # The Regular TrueType file calls its family "Expressway Rg". matplotlib picks
    # a weight only within one family, so file it with Bold and Extra-bold.
    fonts = font_manager.fontManager.ttflist
    fonts[:] = [replace(f, name="Expressway") if f.name == "Expressway Rg" else f for f in fonts]
    return "Expressway"


def use():
    """Load the theme. Returns the font family in use."""
    plt.style.use(str(ASSETS / "style.mplstyle"))
    family = _font()
    if family is None:
        print("mpl_style: no font could be loaded; using matplotlib's default sans", file=sys.stderr)
        family = plt.rcParams["font.sans-serif"][0]
    plt.rcParams["font.family"] = family
    regular = any(f.name == family and f.style == "normal" and f.weight in (400, "normal", "regular")
                  for f in font_manager.fontManager.ttflist)
    if family.startswith("Expressway") and not regular:
        # Without the Regular cut installed, the lightest Expressway here is Bold.
        plt.rcParams["font.weight"] = "bold"
    return family


def finish(fig):
    """Add what a style sheet cannot: an ink ring on lines and the outline on titles."""
    for ax in fig.axes:
        for line in ax.lines:
            width = line.get_linewidth() + 2 * PX
            line.set_path_effects([patheffects.Stroke(linewidth=width, foreground=INK), patheffects.Normal()])
        # The heading outline: 7% of the size, between 1.25px and 2px, drawn as a stroke under the fill.
        size = ax.title.get_fontsize()
        outline = min(max(0.07 * size, 1.25 * PX), 2 * PX)
        for title in (ax.title, ax._left_title, ax._right_title):
            title.set_path_effects([patheffects.Stroke(linewidth=2 * outline, foreground=INK), patheffects.Normal()])
    return fig
