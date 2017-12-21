﻿# c3 Visualization Library
# HTML Table Generation

###################################################################
# Table
###################################################################

# A visualization of data using HTML tables.
#
# Like other c3 visualizations, call `redraw()` to update the table when the `data`
# array is changed and call `restyle()` to update the table when styles or classes
# in the various {c3.Selection.Options options} are changed.  If the set of `columns`
# is changed, then please call `render()` to update the table; this flow has not been
# tested yet, but I can fix any issues that come up if this is needed.
#
# ## Events
# * **select** - Triggered when a row is selected/unselected.  The event is called with an argument:
#   _single_ select tables are passed with their selection while _multi_ select tables are passed with an array of the selections.
#   Selections are references to items in the data array.
# * **match** - Triggered when a search is performed.  The event is called with the search string,
#   the datum for the row, and the row index.
#   If there was no match, the datum and index will be `null`.
# 
# ## Extensibility
# The following members are created which represent {c3.Selection}'s:
# * **table** - The HTML `table`
# * **header** - The HTML table `thead` header
# * **headers** - The individual `th` headers in the header row
# * **body** - The HTML table `tbody` body
# * **rows** - The HTML table `tr` rows
# * **cells** - The HTML table `td` cells
#
# The following additional members are also created:
# * **selections** - [Array] The current table selections.  Items point to entries in the table's `data` array.
#
# @author Douglas Armstrong
class c3.Table extends c3.Base
    @version: 0.1
    type: 'table'
    
    # [Array] Array of data for the table to visualize.
    #   Each element that is defined would be a seperate row in the table.
    data: []
    # [Function] An optional callback to describe a unique key for each data element.
    #   These may be used to affect performance when updating the dataset and for animations.
    key: undefined
    # [Function] A callback to define if data elements should be included in the table or not.  For example,
    #   this could be set to a function that returns true for data elements with some non-zero value to cause
    #   elements with a zero value to not be included in the table.
    filter: undefined
    # [Array<c3.Table.Column>] An array of column objects which describe how to construct the table.
    # Column objects can contain the following members:
    # * **header** [{c3.Selection.Options}] Options to describe the header contents, styles, events, etc.
    #   Use `text` or `html` to define the content for the header.
    # * **cells** [{c3.Selection.Options}] Options to describe the cell contents, styles, events, etc.
    #   Use `text` or `html` to define the cell contents.
    # * **sortable** [Boolean] - Boolean to define if the counter should be user-sortable by clicking on the header.
    # * **value** [Function] - A callback to get the _value_ of the cell for sorting or visualization.
    # * **sort** [Function] - A callback to get the value for sorting, if different then `value`; also sets `sortable` to true.
    # * **sort_ascending** [Boolean] - Sort the rows based on ascending value instead of descending.
    # * **vis** [String] Optional type of visualization for the _value_ of the cells in this column.  Options include:
    #    * _bar_ - The value is represented as a horizontal bar across the cell underlying the content html.
    #      The bars may be styled using _vis_options.styles_.
    # * **total_value** [Number, Function] - Some visualizations, such as _bar_, show their values relative to
    #   some total value.  This number or callback provides for that value.
    #   If not set, the default is to use the sum of values for all the cells in the column.
    # * **vis_options** [{c3.Selection.Options}] Options that may be used by value visualizations.
    #   Using the Table-level vis_options should perform better than column-specific options.
    columns: []
    # [Boolean] Are the table rows selectable
    selectable: false
    # [Boolean, String] True for the table rows to be selectable or a string with possible values:
    # * **single** - A single row can be selected
    # * **multi** - Multiple rows can be selected
    sortable: false
    # [{c3.Table.Column}] The column currently used for sorting
    sort_column: undefined
    # [Number] Limit the number of table rows to the top N
    limit_rows: undefined
    # [Boolean, Number] Page between multiple pages, each the size of `limit_rows`.
    #   Set to `true` to enable or to the page number you would like to display.
    #   This will be set to the currently active page number.
    #   The pagination footer will only render if there is more than one page.
    pagination: false
    # [Number] Maximum number of pages to show at a time in the footer pagination selection.
    #   Minimum value is `3`.
    max_pages_in_paginator: 9
    # [Boolean, Function] Set to enable searching in the footer.
    #   If set to `true`, then the content of all columns will be searched.
    #   Otherwise, it can be set to an accessor function that will be called with the row data and index.
    #   This function should return the string content of the row to be used for searching.
    #   If a match is found the current page is changed so the found row is visible.
    #   The `match` event will be triggered with the search string used.
    #   If a match was found the second and third arguments will be the row data and index of the match,
    #   otherwise they will be `null`.
    #   The user may use regular expressions in their search string.
    searchable: false
    # [Boolean] Allow table to be searchable even if it isn't paginated
    searchable_if_not_paginated: true
    # [{c3.Selection.Options}] Options for the `table` node.
    table_options: undefined
    # [{c3.Selection.Options}] Options for the table `thead` header.
    table_header_options: undefined
    # [{c3.Selection.Options}] Options for the table `th` headers.  Callbacks are called with two arguments:
    # The first is the column object and the second is the column index.
    header_options: undefined
    # [{c3.Selection.Options}] Options for the table `caption` footer used for pagination.
    footer_options: undefined
    # [{c3.Selection.Options}] Options for the table `tbody`.
    table_body_options: undefined
    # [{c3.Selection.Options}] Options for the table `tr` rows.  Callbacks are called with two arguments.
    # The first is the data element, the second is the row index.
    #
    # A `column_options` options could be created using `col` to specify options for each column instead
    # of manually specifying in each column object in `columns`.
    # If this is needed, just let me know.
    row_options: undefined
    # [{c3.Selection.Options}] Options for the table `td` cells.  Callbacks are called with three arguments.
    # The first is the data element, the second is the column index, and the third is the row index.
    cell_options: undefined
    # [{c3.Selection.Options}] Options for any `vis` visualizations, such as inline bar charts.
    # Callbacks are called with the first argument as the data element, the second as
    # the column index, and the third as the row index.
    vis_options: undefined
    
    constructor: -> 
        super
        @selections = [] # Define this here so selections are per-instance

    _init: =>
        # Create the table node
        @table = c3.select(d3.select(@anchor),'table').singleton()
        @table_options ?= {}
        @table_options.styles ?= {}
        @table_options.styles.width ?= '100%'
        @table.options(@table_options).update()
        
        # Create the Header
        @header = @table.inherit('thead').inherit('tr')
        @header.options(@table_header_options).update()
        
        # Create the Body
        @body = @table.inherit('tbody')
        @body.options(@table_body_options).update()
        
        # Prepare the Columns
        @next_column_key ?= 0
        for column in @columns
            column.key ?= @next_column_key++
            # Default text to "" so contents are cleared so we don't append duplicate arrows and div.vis nodes.
            column.header ?= {}; column.header.text ?= ""
            column.cells ?= {}; column.cells.text ?= ""
            column.sortable ?= column.sort?
            column.value ?= column.sort
            column.sort ?= column.value
            if column.sortable and not column.sort?
                throw "column.sort() or column.value() not defined for a sortable column"
            if column.vis and not column.value?
                throw "column.value() not defined for a column with a column.vis visualization"
        
        @_update_headers()


    _update_headers: =>
        self = this
        # Update the headers
        @headers = @header.select('th').bind @columns, (column)->column.key
            .options(@header_options, ((column)->column.header)).update()
        @headers.new.on 'click.sort', (column)=> if @sortable and column.sortable then @sort column
        if @sortable then @headers.all.each (column)-> if column is self.sort_column
            title = d3.select(this)
            title.html title.html()+"<span class='arrow' style='float:right'>#{if column.sort_ascending then '▲' else '▼'}</span>"


    _update: (origin)=>
        self = this
        # Prepare the column totals
        for column in @columns when column.vis
            column.value_total = column.total_value?() ? column.total_value ? undefined
            if not column.value_total? # Default total_value is the sum of all values
                column.value_total = 0
                column.value_total += column.value(datum) for datum in @data
    
        # Filter data
        @current_data = if @filter? then (d for d,i in @data when @filter(d,i)) else @data
    
        # Re-sort the data
        if @sort_column?
            # Copy array so our sorting doesn't corrupt the user's copy
            if !@filter? then @current_data = @current_data[..]
            c3.array.sort_up @current_data, @sort_column.sort
            if not @sort_column.sort_ascending then @current_data.reverse()
        
        # Update the rows
        data = if not @limit_rows then @current_data else
            @limit_rows = Math.floor @limit_rows
            if isNaN @limit_rows then throw Error "limit_rows set to non-numeric value: "+@limit_rows
            current_page = if isNaN(@pagination) then 1 else @pagination
            current_page = Math.max(1, Math.min(Math.ceil(@current_data.length/@limit_rows), current_page))
            if @pagination then @pagination = current_page
            @current_data[@limit_rows*(current_page-1)..(@limit_rows*current_page)-1]
        @rows = @body.select('tr').bind data, @key
        @rows.options(@row_options).update()
        if @key? then @rows.all.order()
        
        # Update the cells
        @cells = @rows.select('td').bind ((d)=> (d for column in @columns)), (d,i)=> @columns[i].key
        if not @columns.some((column)-> column.vis?)
            cell_contents = @cells
        else
            # Cells user options are actually applied to a nested span for proper div.vis rendering
            @vis = @cells.inherit('div.vis')
            @vis.options(@vis_options, ((d,i)=> @columns[i].vis_options)).update()
            cell_contents = @vis.inherit('span')
            
            @vis.all.each (d,i)->
                column = self.columns[i % self.columns.length]
                switch column.vis
                    when 'bar'
                        d3.select(this)
                            .classed 'bar', true
                            .style 'width', column.value(d)/column.value_total*100+'%'
        
        cell_contents.options(@cell_options, ((d,i)=>@columns[i].cells)).update()
        @cells.options(@cell_options, ((d,i)=>@columns[i].cells)) # For use in _style()
        
        # Selectable
        if @selectable
            (if origin is 'render' then @rows.all else @rows.new).on 'click.select', (item)=>
                @select c3.Table.set_select @selections, item,
                    @selectable is 'multi' or (@selectable is true and d3.event.ctrlKey)
            @highlight()
        else if origin is 'render' then @rows.all.on 'click.select', null

        # Footer
        @footer = @table.select('caption')
        paginate = !!@limit_rows and @pagination and @current_data.length > @limit_rows
        searchable = @searchable and (@searchable_if_not_paginated or paginate)
        if searchable or paginate
            @footer.singleton().options(@footer_options).update()
            
            # Pagination
            paginator = @footer.select('span.pagination', ':first-child')
            if paginate
                paginator.singleton()
                num_pages = Math.ceil @current_data.length / @limit_rows
                @max_pages_in_paginator = Math.floor Math.max @max_pages_in_paginator, 3
                left_pages = Math.ceil (@max_pages_in_paginator-3) / 2
                right_pages = Math.floor (@max_pages_in_paginator-3) / 2
            
                # Previous page button
                prev_button = paginator.select('span.prev.button').singleton()
                prev_button.new
                    .text '◀'
                    .on 'click', => @pagination--; @redraw()
                prev_button.all.classed 'disabled', current_page <= 1
            
                # Prepare the set of pages to show in the paginator
                pages = [
                    1
                    (if num_pages > 2 then \
                     [Math.max(2, Math.min(@pagination-left_pages, num_pages-1-left_pages-right_pages)) .. \
                        Math.min(num_pages-1, Math.max(current_page+right_pages, 2+left_pages+right_pages))] \
                     else [])...
                    num_pages
                ]
                # Add ellipses if there are too many page options to show
                if pages[1]-pages[0] > 1 then pages.splice(1,0,'…')
                if pages[pages.length-1]-pages[pages.length-2] > 1 then pages.splice(pages.length-1,0,'…')
            
                # Render the page 
                page_buttons = paginator.select('ul').singleton().select('li').bind pages
                page_buttons.new
                    .on 'click', (p)=> @pagination=p; @redraw()
                page_buttons.all
                    .classed 'active', (p)=> p == current_page
                    .classed 'disabled', (p)=> p == '…'
                    .text (p,i)-> p
                
                # Next page button
                next_button = paginator.select('span.next.button').singleton()
                next_button.new
                    .text '▶'
                    .on 'click', => @pagination++; @redraw()
                next_button.all.classed 'disabled', current_page >= @current_data.length / @limit_rows
            else paginator.remove()
            
            # Searchable
            search_control = @footer.select('span.search')
            # Not searchable if rows are limited but pagination is disabled
            if searchable and not (not paginate and @current_data.length > @limit_rows)
                last_search = ""
                last_found = -1
                search_control.singleton()
                search_control.inherit('span.button').new
                    .text '🔎'
                    .on 'click', =>
                        search_input.node().classList.remove 'notfound'
                        value = search_input.node().value
                        if not value then return
                        re = RegExp value, 'i' # Case insensitive regular expression
                        if value isnt last_search # if already found, find the next one
                            last_found = -1
                            last_search = value
                        content = if @searchable is true # Search all columns if searchable is `true`
                            column_contents = (c3.functor(column.cells.html ? column.cells.text ? @cell_options.html ? @cell_options.text) \
                                        for column in @columns)
                            (d,i)-> (column_content(d,i,j) for column_content,j in column_contents).join(' ')
                        else @searchable
                        for d,i in @current_data when i>last_found
                            if re.test content(d,i)
                                last_found = i
                                @pagination = Math.ceil (i+1)/@limit_rows
                                @redraw()
                                @trigger 'match', value, d, i
                                return
                        last_found = -1
                        search_input.node().classList.add 'notfound'
                        @trigger 'match', value, null, null
                search_input = search_control.inherit('input').new
                    .attr 'type', 'text'
                    .on 'keydown', ->
                        this.classList.remove 'notfound'
                        if this.value and d3.event.keyCode is 13 # When user presses ENTER
                            search_control.select('.button').node().click()
            else search_control.remove()
        else @footer.remove()


    _style: (style_new)=>
        self = this
        @table.style().all.classed
            'c3': true
            'table': true
            'sortable': @sortable
            'selectable': @selectable
            'single_select': @selectable is 'single'
            'multi_select': @selectable is 'multi'
            'paginated': @pagination and @limit_rows and @current_data.length > @limit_rows
            'searchable': !!@searchable
        if @class?
            @table.all.classed klass, true for klass in @class.split(' ')
        
        @header.style()
        @headers.style(style_new).all.classed
            'sortable': if not @sortable then false else (column)-> column.sort?
            'sorted': (d)=> d==@sort_column

        @body.style()
        @rows.style(style_new)
        sort_column_i = @columns.indexOf @sort_column
        @cells.style(style_new and @key?).all.classed
            'sorted': (d,i)-> i is sort_column_i
        @vis?.style(style_new and @key?)
    
    # Sort the table
    # @param column [column] A reference to the column object to sort on
    # @param ascending [Boolean] True to sort top to bottom based on ascending values,
    #   otherwise alternate on subsequent calls to sorting on the same column.
    sort: (column, ascending) => if column.sort
        if ascending? then column.sort_ascending = ascending
        else if @sort_column==column then column.sort_ascending = not column.sort_ascending
        @sort_column = column
        @_update_headers()
        @redraw 'sort'

    # Update the visual selection in the table without triggering selection event
    # @param selections [Array] An array of items to select referencing items in the data array
    highlight: (@selections=@selections)=>
        @rows.all.classed 'selected', if not @selections.length then false else (d)=> (d in @selections)
        @rows.all.classed 'deselected', if not @selections.length then false else (d)=> not (d in @selections)

    # Select items in the table and trigger the selection event
    # @param selections [Array] An array of items to select referencing items in the data array
    select: (@selections=@selections)=>
        @highlight()
        @trigger 'select', @selections

    # Helper logic for selecting an item in a multiple-select list with a click or ctrl-click
    # @param set [Array] An array of items that represents the current selection
    # @param item [Object] A new item to add or remove from the current selection
    # @param multi_select [Boolean] Indicate if multiple selections are allowed
    # @return [Array] This returns the new set, but also modifys the set passed in, so old references are still valid
    @set_select = (set, item, multi_select)->
        if not set? then return [item]
        else if multi_select
            if item in set then c3.array.remove_item set, item
            else set.push item
        else switch set.length
            when 0 then set.push item
            when 1
                if item in set then set.length=0
                else set.length=0; set.push item
            else set.length=0; set.push item
        return set
