try:
	from .template_config import get_rcv_template
except ImportError:
	from template_config import get_rcv_template

TEMPLATE = get_rcv_template()