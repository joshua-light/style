"""The style for matplotlib: load the theme, then finish a figure.

    import sys; sys.path.insert(0, "<skill dir>/scripts")
    import mpl_style

    mpl_style.use()                 # theme and font; call before drawing
    fig, ax = plt.subplots(figsize=(4.4, 2.4))
    ax.bar(names, values)
    ax.set_title("Damage done")
    mpl_style.finish(fig)           # ink rings, outlined title
    fig.savefig("chart.png")

use() returns the font family in use. Expressway ships only as woff2, which
matplotlib cannot read, so use() converts it once into a cache directory (this
needs fontTools and brotli). Without them, or without the font files, text
falls back to matplotlib's default sans and use() says so on stderr.

Text is Expressway Regular where that cut is installed on the machine (its
licence forbids bundling it here), and Expressway Bold where it is not.
"""
import sys
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager, patheffects

ASSETS = Path(__file__).resolve().parent.parent / "assets"
CACHE = Path.home() / ".cache" / "style-fonts"
INK = "#000000"
PX = 0.72  # one pixel in points, at the theme's 100 dpi


def _font():
    """Register Expressway and return its family name, or None when it cannot be loaded."""
    for stem in ("expressway", "expressway-xb"):
        source = next((ASSETS / "fonts" / (stem + ext) for ext in (".ttf", ".otf", ".woff2")
                       if (ASSETS / "fonts" / (stem + ext)).exists()), None)
        if source is None:
            continue
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
                    continue
        font_manager.fontManager.addfont(str(path))
    # An Expressway installed after matplotlib built its font cache is not in the list yet.
    for installed in font_manager.findSystemFonts():
        if "expressway" in Path(installed).name.lower():
            try:
                font_manager.fontManager.addfont(installed)
            except Exception:  # an unreadable file is not worth failing the chart for
                pass
    names = {f.name for f in font_manager.fontManager.ttflist}
    return next((name for name in ("Expressway", "Expressway Rg", "Overpass") if name in names), None)


def use():
    """Load the theme. Returns the font family in use."""
    plt.style.use(str(ASSETS / "style.mplstyle"))
    family = _font()
    if family is None:
        print("mpl_style: Expressway is not available; using matplotlib's default sans", file=sys.stderr)
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
