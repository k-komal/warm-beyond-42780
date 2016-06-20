function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
}
function camelize(str) {
  if (str == "Availability")
    return "availability";
  if (str == "Subtitle")
    return "subtitleLanguages";
  if (str == "Domain")
    return "domains";
  return "primaryLanguages";
}
var FacetCardItem = React.createClass({
  getInitialState: function() {
    return {isChecked: false};
  },
  componentDidMount: function() {
    if($.inArray(this.props.value, CS.data[camelize(this.props.name)]) > -1) {
      this.setState({isChecked: true});
    }
  },
  handleClick: function() {
    this.setState({isChecked: !this.state.isChecked});
  },
  render: function() {
    var cname;
    if(this.props.indx>2){
      var n = this.props.name.split(' ')
      cname="list-group-item hide "+n[0]
    } else{
      cname="list-group-item"
    }
    return (
      <li className={cname}>
        <div className="checkbox">
          <div className="label label-primary count">{this.props.count}</div>
          <label>
            <input type="checkbox" className="facets" name={this.props.name} onChange={this.props.handleChange} onClick={this.handleClick} checked={this.state.isChecked} value={this.props.value} />
            <span>{this.props.vname}</span>
          </label>
        </div>
      </li>
    );
  }
});
var FacetItem = React.createClass({
  getInitialState: function(){
    return {showState: 0};
  },
  showitem: function(){
    var tmp = this.props.data.name.split(' ')
    if(this.state.showState == 0){
      var cn = '.'+tmp[0];
      $(cn).css('display','block');
      cn = cn+'show';
      $(cn).text('Show Less');
      this.setState({showState: 1});
      
    }
    else{
      var cn = '.'+tmp[0];
      $(cn).css('display','none');
      cn = cn+'show';
      $(cn).text('Show More');
      this.setState({showState: 0});
    }
  },
  render: function() {
    var list = this.props.data.values.map(function(value, i) {
      return (
        <FacetCardItem key={i} indx={i} name={this.props.data.name} value={value.id} vname={value.name} count={value.count} handleChange={this.props.handleChange}/>
      );
    }.bind(this));
    return (
      <div className="card">
        <div className="card-header">{this.props.data.name}</div>
        <ul className="list-group list-group-flush">
          {list}
          <li className={this.props.data.name+'show'+' list-group-item btn'} onClick={this.showitem.bind(this)}>Show More</li>
        </ul>
      </div>
    );
  }
});
var FacetList = React.createClass({
  getInitialState: function() {
    return {data: [], query: ""};
  },
  componentDidMount: function() {
    this.setState(this.props.data);
  },
  render: function() {
    var list = Object.keys(this.state.data).map(function(key, i) {
      var data = {
        name: key,
        values: this.state.data[key]
      };
      return <FacetItem key={key} data={data} handleChange={this.props.handleChange}/>
    }.bind(this));
    return (
      <form id="filterForm">
        <input type="hidden" name="query" value={this.state.query} />
        {list}
      </form>
    );
  }
});

var Instructor = React.createClass({
  render: function() {
    return (
      <li className="list-group-item">
        <span className="label label-default">IN</span> {this.props.name}
      </li>
    );
  }
});
var InstructorList = React.createClass({
  render: function() {
    var INodes = this.props.data.map(function(instructor, i) {
      return (
        <Instructor key={i} name={instructor.insName} />
      );
    });
    return (
      <div>
        {INodes}
      </div>
    );
  }
});
var CardItem = React.createClass({
  render: function() {
    var partner;
    if (this.props.data.partner.logo) {
      partner = <img src={this.props.data.partner.logo} />;
    } else {
      partner = (<span className="label label-primary">Partner</span>);
    }
    var link = 'https://www.coursera.org/';
    if(this.props.data.courseType == 'v1.session') {
      link += 'course/' + this.props.data.slug;
    } else if(this.props.data.courseType == 'v2.ondemand') {
      link += 'learn/' + this.props.data.slug;
    } else {
      link += '/courses?query=' + this.props.data.name;
    }
    return (
      <a href={link} target='_blank'>
        <div className="card">
          <img className="card-img" src={this.props.data.photo} />
          <div className="card-img-overlay">
            <div className="card-block">
              <h4 className="card-title otto">{this.props.data.name}</h4>
            </div>
          </div>
          <div className="card-block partner">
            {partner}
            <p>{this.props.data.partner.partname}</p>
          </div>
          <ul className="list-group list-group-flush">
            <InstructorList data={this.props.data.instructor} />
          </ul>
        </div>
      </a>
    );
  }
});
var ItemColumn = React.createClass({
  getInitialState: function() {
    return this.props.data;
  },
  componentDidMount: function() {
    this.setState(this.props.data);
  },
  handleLoadMoreClick: function() {
    var next = CS.data.next;
    var nextQuery = updateQueryStringParameter(CS.data.nextQuery, 'start', next);
    var url = '/searchAjax/' + nextQuery;
    // window.location = url;
    $.ajax({
      url: url,
      dataType: 'json',
      success: function(data) {
        var newData = this.state.data;
        newData = newData.concat(data.result);
        CS.data.nextQuery = nextQuery;
        CS.data.next = data.next;
        this.setState({data: newData});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(url, status, err.toString());
      }.bind(this)
    });
  },
  render: function() {
    var ItemNodes = this.state.data.map(function(card, i) {
      return <CardItem key={i} data={card} />;
    });
    var cname;
    var cardClass;
    if(CS.data.total != 0){
      if(CS.data.next == -1){
        cname = "btn btn-primary btn-block disable";
      }
      else{
        cname = "btn btn-primary btn-block";
      }
      cardClass="card"
    }
    else{
      cardClass="hide"
    }
    return (
      <div className="card-columns">
        {ItemNodes}
        <div className={cardClass}>
          <button className={cname} onClick={this.handleLoadMoreClick}>Load more</button>
        </div>
      </div>
    );
  }
});

var Results = React.createClass({
  getInitialState: function() {
    return {facetData: {data: window.CS.data.facet, query: window.CS.data.query}, resultList: {data: window.CS.data.result}}
  },
  handleChange: function() {
    var params = $('#filterForm').serialize();
    var url = '/search/?' + params;
    window.location = url;
    
  },
  render: function() {
    return (
      <div className="row">
        <div className="col-lg-3 collapse" id="facetColumns">
          <FacetList handleChange={this.handleChange} data={this.state.facetData}/>
        </div>
        <div className="col-lg-9" id="cardColumns">
          <ItemColumn data={this.state.resultList} />
        </div>
      </div>
    );
  }
});
ReactDOM.render(
  <Results />,
  document.getElementById('results')
);
