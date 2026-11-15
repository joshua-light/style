"""The style for plotly: a template that follows the stylesheet's tokens.

    import sys; sys.path.insert(0, "<skill dir>/scripts")
    import plotly_style

    plotly_style.use()              # registers "style" and makes it the default
    fig = go.Figure(go.Bar(x=names, y=values))
    fig.update_layout(title_text="Damage done")

The figure sits on the panel gray. Marks are flat, with a 1px ink edge; lines
are 2px and straight; markers are 8px circles. Text is Expressway where the
reader has it, and Fira Sans, the fallback, where not: plotly draws in the
browser, so the page that shows the figure must load the face.

plotly cannot draw the ink ring around a line or the outline on a title. A
figure that needs them is an inline SVG .chart instead.
"""
import plotly.graph_objects as go
import plotly.io as pio

INK = "#000000"
SUNKEN = "#212121"
PANEL = "#333333"
TEXT = "#d9d9d9"
DIM = "#a3a3a3"
SERIES = ["#528ebf", "#c3ad48", "#9466ba", "#ce7b47", "#bec1c6", "#d28aac"]
FONT = "Expressway, Fira Sans, sans-serif"


def template():
    """The template: surfaces, text, series colours, and each mark's defaults."""
    axis = dict(
        gridcolor=SUNKEN, gridwidth=1, linecolor=INK, linewidth=1, zerolinecolor=INK, zerolinewidth=1,
        ticks="", tickfont=dict(size=12, color=DIM), title=dict(font=dict(size=12, color=DIM)),
    )
    edge = dict(color=INK, width=1)
    return go.layout.Template(
        layout=dict(
            paper_bgcolor=PANEL,
            plot_bgcolor=PANEL,
            colorway=SERIES,
            font=dict(family=FONT, size=12, color=DIM),
            title=dict(font=dict(size=20, color=TEXT, weight=700), x=0, xanchor="left", pad=dict(l=16)),
            margin=dict(l=48, r=16, t=56, b=40),
            # Only the baseline is an ink rule; the value axis shows gridlines alone.
            xaxis=dict(axis, showgrid=False, showline=True),
            yaxis=dict(axis, showline=False, zeroline=False),
            legend=dict(font=dict(size=14, color=DIM), bgcolor=PANEL, borderwidth=0, orientation="h",
                        x=1, xanchor="right", y=1.02, yanchor="bottom"),
            hoverlabel=dict(bgcolor=SUNKEN, bordercolor=INK, font=dict(family=FONT, size=14, color=TEXT)),
            bargap=0.1,
            shapedefaults=dict(line=dict(color=DIM, width=1)),
            annotationdefaults=dict(font=dict(size=12, color=DIM), arrowcolor=DIM),
        ),
        data=dict(
            bar=[go.Bar(marker=dict(line=edge))],
            histogram=[go.Histogram(marker=dict(line=edge))],
            scatter=[go.Scatter(
                line=dict(width=2, shape="linear"),
                marker=dict(symbol="circle", size=8, line=edge),
            )],
            pie=[go.Pie(marker=dict(line=edge), sort=False, direction="clockwise", textfont=dict(color=INK))],
            heatmap=[go.Heatmap(colorscale=[[0, SUNKEN], [1, SERIES[0]]], xgap=1, ygap=1)],
        ),
    )


def use():
    """Register the template as "style" and make it the default."""
    pio.templates["style"] = template()
    pio.templates.default = "style"
    return "style"
