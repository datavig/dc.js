import {pluck, utils} from '../core/utils';

const LABEL_GAP = 2;

/**
 * Legend is a attachable widget that can be added to other dc charts to render horizontal legend
 * labels.
 *
 * Examples:
 * - {@link http://dc-js.github.com/dc.js/ Nasdaq 100 Index}
 * - {@link http://dc-js.github.com/dc.js/crime/index.html Canadian City Crime Stats}
 * @example
 * chart.legend(new Legend().x(400).y(10).itemHeight(13).gap(5))
 * @returns {Legend}
 */
export class Legend {
    constructor () {
        this._parent = undefined;
        this._x = 0;
        this._y = 0;
        this._itemHeight = 12;
        this._gap = 5;
        this._horizontal = false;
        this._legendWidth = 560;
        this._itemWidth = 70;
        this._autoItemWidth = false;
        this._legendText = pluck('name');
        this._maxItems = undefined;

        this._g = undefined;
    }

    parent (p) {
        if (!arguments.length) {
            return this._parent;
        }
        this._parent = p;
        return this;
    }

    /**
     * Set or get x coordinate for legend widget.
     * @param  {Number} [x=0]
     * @returns {Number|Legend}
     */
    x (x) {
        if (!arguments.length) {
            return this._x;
        }
        this._x = x;
        return this;
    }

    /**
     * Set or get y coordinate for legend widget.
     * @param  {Number} [y=0]
     * @returns {Number|Legend}
     */
    y (y) {
        if (!arguments.length) {
            return this._y;
        }
        this._y = y;
        return this;
    }

    /**
     * Set or get gap between legend items.
     * @param  {Number} [gap=5]
     * @returns {Number|Legend}
     */
    gap (gap) {
        if (!arguments.length) {
            return this._gap;
        }
        this._gap = gap;
        return this;
    }

    /**
     * Set or get legend item height.
     * @param  {Number} [itemHeight=12]
     * @returns {Number|Legend}
     */
    itemHeight (itemHeight) {
        if (!arguments.length) {
            return this._itemHeight;
        }
        this._itemHeight = itemHeight;
        return this;
    }

    /**
     * Position legend horizontally instead of vertically.
     * @param  {Boolean} [horizontal=false]
     * @returns {Boolean|Legend}
     */
    horizontal (horizontal) {
        if (!arguments.length) {
            return this._horizontal;
        }
        this._horizontal = horizontal;
        return this;
    }

    /**
     * Maximum width for horizontal legend.
     * @param  {Number} [legendWidth=500]
     * @returns {Number|Legend}
     */
    legendWidth (legendWidth) {
        if (!arguments.length) {
            return this._legendWidth;
        }
        this._legendWidth = legendWidth;
        return this;
    }

    /**
     * Legend item width for horizontal legend.
     * @param  {Number} [itemWidth=70]
     * @returns {Number|Legend}
     */
    itemWidth (itemWidth) {
        if (!arguments.length) {
            return this._itemWidth;
        }
        this._itemWidth = itemWidth;
        return this;
    }

    /**
     * Turn automatic width for legend items on or off. If true, {@link Legend#itemWidth itemWidth} is ignored.
     * This setting takes into account the {@link Legend#gap gap}.
     * @param  {Boolean} [autoItemWidth=false]
     * @returns {Boolean|Legend}
     */
    autoItemWidth (autoItemWidth) {
        if (!arguments.length) {
            return this._autoItemWidth;
        }
        this._autoItemWidth = autoItemWidth;
        return this;
    }

    /**
     * Set or get the legend text function. The legend widget uses this function to render the legend
     * text for each item. If no function is specified the legend widget will display the names
     * associated with each group.
     * @param  {Function} [legendText]
     * @returns {Function|Legend}
     * @example
     * // default legendText
     * legend.legendText(pluck('name'))
     *
     * // create numbered legend items
     * chart.legend(new Legend().legendText(function(d, i) { return i + '. ' + d.name; }))
     *
     * // create legend displaying group counts
     * chart.legend(new Legend().legendText(function(d) { return d.name + ': ' d.data; }))
     */
    legendText (legendText) {
        if (!arguments.length) {
            return this._legendText;
        }
        this._legendText = legendText;
        return this;
    }

    /**
     * Maximum number of legend items to display
     * @param  {Number} [maxItems]
     * @return {Legend}
     */
    maxItems (maxItems) {
        if (!arguments.length) {
            return this._maxItems;
        }
        this._maxItems = utils.isNumber(maxItems) ? maxItems : undefined;
        return this;
    }

    // Implementation methods

    _legendItemHeight () {
        return this._gap + this._itemHeight;
    }

    render () {
        this._parent.svg().select('g.dc-legend').remove();
        this._g = this._parent.svg().append('g')
            .attr('class', 'dc-legend')
            .attr('transform', `translate(${this._x},${this._y})`);
        let legendables = this._parent.legendables();

        if (this._maxItems !== undefined) {
            legendables = legendables.slice(0, this._maxItems);
        }

        const itemEnter = this._g.selectAll('g.dc-legend-item')
            .data(legendables)
            .enter()
            .append('g')
            .attr('class', 'dc-legend-item')
            .on('mouseover', d => {
                this._parent.legendHighlight(d);
            })
            .on('mouseout', d => {
                this._parent.legendReset(d);
            })
            .on('click', d => {
                d.chart.legendToggle(d);
            });

        this._g.selectAll('g.dc-legend-item')
            .classed('fadeout', d => d.chart.isLegendableHidden(d));

        if (legendables.some(pluck('dashstyle'))) {
            itemEnter
                .append('line')
                .attr('x1', 0)
                .attr('y1', this._itemHeight / 2)
                .attr('x2', this._itemHeight)
                .attr('y2', this._itemHeight / 2)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', pluck('dashstyle'))
                .attr('stroke', pluck('color'));
        } else {
            itemEnter
                .append('rect')
                .attr('width', this._itemHeight)
                .attr('height', this._itemHeight)
                .attr('fill', d => d ? d.color : 'blue');
        }

        {
            const self = this;

            itemEnter.append('text')
                .text(self._legendText)
                .attr('x', self._itemHeight + LABEL_GAP)
                .attr('y', function () {
                    return self._itemHeight / 2 + (this.clientHeight ? this.clientHeight : 13) / 2 - 2;
                });
        }

        let cumulativeLegendTextWidth = 0;
        let row = 0;

        {
            const self = this;

            itemEnter.attr('transform', function (d, i) {
                if (self._horizontal) {
                    const itemWidth = self._autoItemWidth === true ? this.getBBox().width + self._gap : self._itemWidth;
                    if ((cumulativeLegendTextWidth + itemWidth) > self._legendWidth && cumulativeLegendTextWidth > 0) {
                        ++row;
                        cumulativeLegendTextWidth = 0;
                    }
                    const translateBy = `translate(${cumulativeLegendTextWidth},${row * self._legendItemHeight()})`;
                    cumulativeLegendTextWidth += itemWidth;
                    return translateBy;
                } else {
                    return `translate(0,${i * self._legendItemHeight()})`;
                }
            });
        }
    }

}

export const legend = () => new Legend();
