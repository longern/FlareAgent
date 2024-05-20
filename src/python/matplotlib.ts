const matplotlib = `
import base64
import os

from io import BytesIO

os.environ['MPLBACKEND'] = 'AGG'

import matplotlib.pyplot

def ensure_matplotlib_patch():
    def show():
        buf = BytesIO()
        matplotlib.pyplot.savefig(buf, format='png')
        buf.seek(0)
        img = base64.b64encode(buf.read()).decode('utf-8')
        matplotlib.pyplot.clf()
        print("data:image/png;base64," + img)

    matplotlib.pyplot.show = show

ensure_matplotlib_patch()
`;

export default matplotlib;
