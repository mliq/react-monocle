import React from 'react';
import { tree, hierarchy, select, path } from 'd3';
import Node from './Node.jsx';
const cloneDeep = require('lodash.clonedeep');


class Graph extends React.Component {
  constructor() {
    super();
    this.state = {
      width: 1300,
      height: 900,
      nodeW: 200,
      nodeH: 100,
      nodes: [],
    };
    this.highlight = this.highlight.bind(this);
    this.lowlight = this.lowlight.bind(this);
    this.resizeGraph = this.resizeGraph.bind(this);
    this.updateLinks = this.updateLinks.bind(this);
    this.highlightRecursion = this.highlightRecursion.bind(this);
  }

  componentWillMount() {
    let i = 0;
    const renderArr = [];
    const root = cloneDeep(this.props.treeData);

    // initial d3 tree declaration
    const nodes = tree().size([this.state.width, this.state.height])(hierarchy(root));
    nodes.each(d => {
      d.y = d.depth * this.state.height / 3;
      d.id = d.id || ++i;
      // using the information provided by d3 Node components are rendered
      renderArr.push(<Node
        xtranslate={d.x}
        ytranslate={d.y}
        id={i}
        key={i}
        highlight={this.highlight.bind(this, i)}
        lowlight={this.lowlight}
        name={d.data.name}
        props={d.data.props}
        state={d.data.state}
        methods={d.data.methods}
        width={this.state.nodeW}
        height={this.state.nodeH}
      />);
    });

    // setting state so information can be used in render + other methods
    this.setState({
      nodes: renderArr,
      d3nodes: nodes,
    });
  }

  componentDidMount() {
    this.updateLinks();
  }

  updateLinks() {
    // links are not rendered by react, as d3 has to control the links for highlighting purposes later
    const svg = select(document.getElementById('graphz'));
    const links = this.state.d3nodes.links();
    svg.selectAll('path.link').data(links, d => { return d.target.id; })
    .enter().insert('svg:path', 'foreignObject')
    .attr('class', 'link')
    .attr('d', (node) => {
      // creating a cubic bezier curve for the link
      // equiv to d3.svg.diagonal before 4.0
      const oldX = node.source.x;
      const oldY = node.source.y;
      const newX = node.target.x;
      const newY = node.target.y;
      const pathing = path();
      pathing.moveTo(oldX + this.state.nodeW / 2, oldY);
      pathing.bezierCurveTo(oldX + this.state.nodeW / 2, (oldY + newY) / 2, newX + this.state.nodeW / 2, (oldY + newY) / 2, newX + this.state.nodeW / 2, newY);
      return pathing;
      // return `M${oldX + this.state.nodeW / 2},${oldY}C${oldX + this.state.nodeW / 2},${(oldY + newY) / 2} ${newX + this.state.nodeW / 2},${(oldY + newY) / 2} ${newX + this.state.nodeW / 2},${newY}`;
    });
    this.resizeGraph();
  }

  highlightRecursion(d) {
    // finds out which links to highlight
    // recurses up to where there is no parent (top most node)
    if (!d.parent) return d;
    select(document.getElementById('graphz'))
    .selectAll('path.link').filter(ele => {
      if (ele.source.id === d.parent.id && ele.target.id === d.id) return ele;
      return false;
    })
    .classed('highlight', true);
    return this.highlightRecursion(d.parent);
  }

  highlight(i, e) {
    // highlight links on hover over
    e.preventDefault();
    this.state.d3nodes.each(ele => {
      if (ele.id === i) this.highlightRecursion(ele);
    });
    return true;
  }

  lowlight() {
    // unhighlight on cursor exit
    return select(document.getElementById('graphz'))
           .selectAll('path.link')
           .classed('highlight', false);
  }

  resizeGraph() {
    // makes sure graph is the right size after rendering the graph
    const graphz = document.getElementById('graphz');
    this.setState({
      width: graphz.getBBox().x + graphz.getBBox().width + 110,
      height: graphz.getBBox().y + graphz.getBBox().height + 100,
    });
  }

  render() {
    const gStyle = {
      transform: 'translate(0px,40px)',
    };
    return (
      <svg height={this.state.height} width={this.state.width}>
        <g style={gStyle} id="graphz">
          {this.state.nodes}
        </g>
        <div className="testing"></div>
      </svg>
    );
  }
}

Graph.propTypes = {
  treeData: React.PropTypes.object.isRequired,
};

Graph.defaultProps = {
  treeData: {
    name: '',
    children: [],
    props: [],
    methods: [],
    state: [],
  },
};

export default Graph;
