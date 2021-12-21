import prettytable
import six

import click

SHORT_ID_LENGTH = 12

def key_output(f):
    return f + "_output"

def swap_origin(obj, f):
    fo = name_origin(f)
    obj[f], obj[fo] = obj[fo], obj[f]

def lift_fields(obj, layer, fields):
    if not obj.get(layer):
        return

    for f in fields:
        if obj[layer].get(f) is not None:
            obj[key_output(f)] = obj[layer][f]

ALIGNMENTS = {
    int: 'r',
    str: 'l',
    float: 'r',
}

def _output_list(columns, data):
    p = prettytable.PrettyTable(columns,
                                print_empty=False)
    p.padding_width = 1

    # Figure out the types of the columns in the
    # first row and set the alignment of the
    # output accordingly.
    data_iter = iter(data)
    try:
        first_row = next(data_iter)
    except StopIteration:
        pass
    else:
        for value, name in zip(first_row, columns):
            alignment = ALIGNMENTS.get(type(value), 'l')
            p.align[name] = alignment
        # Now iterate over the data and add the rows.
        p.add_row(first_row)
        for row in data_iter:
            row = [r.replace('\r\n', '\n').replace('\r', ' ')
                   if isinstance(r, six.string_types) else r
                   for r in row]
            p.add_row(row)
    formatted = p.get_string(fields=columns)
    click.echo(formatted)
    click.echo('\n')

def _output_one(columns, data):
    p = prettytable.PrettyTable(field_names=('Field', 'Value'),
                                print_empty=False)
    p.padding_width = 1
    # Align all columns left because the values are
    # not all the same type.
    p.align['Field'] = 'l'
    p.align['Value'] = 'l'
    for name, value in zip(columns, data):
        value = (value.replace('\r\n', '\n').replace('\r', ' ') if
                 isinstance(value, six.string_types) else value)
        p.add_row((name, value))
    formatted = p.get_string(fields=('Field', 'Value'))
    click.echo(formatted)

"""columns examples:
columns = ("docker_id", "name", "docker_version", "cpus", "memory", "containers")
"""
def list(columns, data):
    to_display = [[row[key_output(k)]
                   if key_output(k) in row else row.get(k)
                   for k in columns] for row in data]
    _output_list(columns, to_display)

def show(columns, data):
    to_display = [data[key_output(k)]
                  if key_output(k) in data else data.get(k)
                  for k in columns]
    _output_one(columns, to_display)


"""column_map examples:
column_map = (("docker_id", "ID"),
              ("name", "Name"),
              ("docker_version", "Docker Version"),
              ("cpus", "CPU"),
              ("memory", "Memory"),
              ("containers", "Containers"))
"""
def list_with_map(column_map, data):
    columns = [v for (k, v) in column_map]
    to_display = [[row[key_output(k)]
                   if key_output(k) in row else row.get(k)
                   for (k, v) in column_map] for row in data]
    _output_list(columns, to_display)

def show_with_map(column_map, data):
    columns = [v for (k, v) in column_map]
    to_display = [data[key_output(k)]
                  if key_output(k) in data else data.get(k)
                  for (k, v) in column_map]
    _output_one(columns, to_display)

def hexdump(src, length=16, sep='.'):
    FILTER = ''.join([(len(repr(chr(x))) == 3) and chr(x) or sep for x in range(256)])
    lines = []
    for c in xrange(0, len(src), length):
        chars = src[c:c+length]
        hex = ' '.join(["%02x" % ord(x) for x in chars])
        if len(hex) > 24:
            hex = "%s %s" % (hex[:24], hex[24:])
        printable = ''.join(["%s" % ((ord(x) <= 127 and FILTER[ord(x)]) or sep) for x in chars])
        lines.append("%08x:  %-*s    %s\n" % (c, length*3, hex, printable))
    click.echo(''.join(lines))
