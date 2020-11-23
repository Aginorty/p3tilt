
let canvas, canvasWidth = 1000, canvasHeight = 500;
var gui;

// tilt input params
var tilt_angle_deg = 0.0;
var tilt_angle_degMin = 0.0;
var tilt_angle_degMax = 15.0;
var tilt_angle_degStep = 0.1;

// ground hight input params
var angle_from_optical_axis = 0.00;
var angle_from_optical_axisMin = -30.0;
var angle_from_optical_axisMax = 30.0;
var angle_from_optical_axisStep = 1.0;

var pixelsPerMeter = 200.0;

var machineWidthM = 2.0;
var machineHeightM = 1.1;

var leftCameraPosxM = -0.5; // from the center of the machine
var rightCameraPosxM = 0.5;


var dynamic_p3;
var camera_left;
var camera_right;
var camera_left_init_pos;
var camera_right_init_pos;
var initial_camera_angle_deg = 20;
var ground_pos_y = canvasHeight-40;

var machine_left_side_x = 80;

var plot;
var points;

var previous_angle;

var right_error;

//reset plot button
var reset_plot_button;

// draw current right wheel height vars
var current_right_wheel_pos;

function setup() {
  angleMode(RADIANS);
  var canvas = createCanvas(canvasWidth, canvasHeight);
  addScreenPositionFunction();
  gui = createGui('Controller parameters');
  gui.addGlobals('tilt_angle_deg', 'angle_from_optical_axis');

  dynamic_p3 = new P3();
  camera_left_init_pos = createVector(machine_left_side_x + (machineWidthM/2 + leftCameraPosxM)*pixelsPerMeter, ground_pos_y -machineHeightM*pixelsPerMeter, 0);
  camera_right_init_pos = createVector(machine_left_side_x + (machineWidthM/2 + rightCameraPosxM)*pixelsPerMeter, ground_pos_y -machineHeightM*pixelsPerMeter, 0);

  // plot right camera error
  plot = new GPlot(this);
	plot.setPos(canvasWidth - 500, 50);
  plot.setTitleText("Right camera projection error due to tilt error");
  plot.getXAxis().setAxisLabelText("angle from optical axis (deg)");
	plot.getYAxis().setAxisLabelText("projection error (m)");
  plot.setLineColor(0,0,0)
  points = [];
  current_points = [];
  // points[0] = new GPoint(1, 1, "");

  previous_angle = angle_from_optical_axis;

  reset_plot_button = createButton('Reset points');
  reset_plot_button.position(canvasWidth - 430, canvasHeight - 140);
  reset_plot_button.mousePressed(resetPlotPoints);
}

function draw() {
  background(201);
  dynamic_p3.render();

  //ground plane
  let c = color(35, 34, 45);
  stroke(c);
  strokeWeight(3)
  line(20, ground_pos_y, canvasWidth-20, ground_pos_y);

  plot.beginDraw();
	plot.drawBox();
	plot.drawXAxis();
	plot.drawYAxis();
	plot.drawTitle();
	plot.drawGridLines(GPlot.BOTH);
	plot.drawPoints();
	plot.drawLabels();
	plot.endDraw();
}

function P3(){
  this.position = createVector(machine_left_side_x, ground_pos_y, 0);
}

P3.prototype.render = function(){
  let c = color(245, 172, 27);
  stroke(c);
  push();
  translate(this.position.x, this.position.y);
  rotate( -radians(tilt_angle_deg));

  line(0,0, 0, -machineHeightM*pixelsPerMeter);
  line(0, -machineHeightM*pixelsPerMeter,  machineWidthM*pixelsPerMeter,-machineHeightM*pixelsPerMeter);
  line(machineWidthM*pixelsPerMeter,-machineHeightM*pixelsPerMeter, machineWidthM*pixelsPerMeter,0 );

  // annotations
  stroke(0,0,0)
  strokeWeight(1)
  text("2.0 m", machineWidthM*pixelsPerMeter/2, -machineHeightM*pixelsPerMeter-32 )
  line(0, -machineHeightM*pixelsPerMeter-27,  machineWidthM*pixelsPerMeter,-machineHeightM*pixelsPerMeter - 27);

  text("1.5 m",(machineWidthM/2 + rightCameraPosxM)*pixelsPerMeter/2, -machineHeightM*pixelsPerMeter-15 )
  line(0, -machineHeightM*pixelsPerMeter-10,  (machineWidthM/2 + rightCameraPosxM)*pixelsPerMeter,-machineHeightM*pixelsPerMeter - 10);

  text("1.1 m", -50, -machineHeightM*pixelsPerMeter/2)
  line(-10, 0,  -10,-machineHeightM*pixelsPerMeter);

  camera_left = screenPosition( (machineWidthM/2 + leftCameraPosxM)*pixelsPerMeter, -machineHeightM*pixelsPerMeter , 0);
  camera_right = screenPosition( (machineWidthM/2 + rightCameraPosxM)*pixelsPerMeter, -machineHeightM*pixelsPerMeter , 0);

  current_right_wheel_pos = screenPosition(machineWidthM*pixelsPerMeter, 0,0);

  pop();

  push()
  draw_static_camera(ground_pos_y, camera_left_init_pos);
  draw_static_camera(ground_pos_y, camera_right_init_pos);

  right_error = draw_camera(ground_pos_y, camera_right, tilt_angle_deg, 10, camera_right_init_pos);
  draw_camera(ground_pos_y, camera_left, tilt_angle_deg, 20, camera_left_init_pos);
  pop()

  if(abs(previous_angle - angle_from_optical_axis) > 1){
    if(points.length < 1){
    points[0] = new GPoint(angle_from_optical_axis,right_error, "");
  }else {
    points[points.length] = new GPoint(angle_from_optical_axis,right_error, "");
    current_points[0] = new GPoint(angle_from_optical_axis,right_error, "");
  }
    previous_angle = angle_from_optical_axis;
    plot.setPoints(points);
  }
  var initial_whee_position = createVector(machineWidthM*pixelsPerMeter, ground_pos_y,0)
  drawRigthWheelHeight(current_right_wheel_pos,initial_whee_position, radians(tilt_angle_deg), machineWidthM*pixelsPerMeter)

}

function draw_camera(ground_pos_y_, camera_center_, machine_angle_, error_pos, init_camera_center){
  stroke(255, 0, 0);
  circle(camera_center_.x, camera_center_.y, 5);
  stroke(0, 0, 0);
  strokeWeight(2);
  camera_distance_from_ground_ = ground_pos_y_ - camera_center_.y;

  // right side
  var camera_angle_with_ground_right_side_ = radians(initial_camera_angle_deg) + radians(machine_angle_);

  projection_point_x = camera_center_.x + tan(camera_angle_with_ground_right_side_)*camera_distance_from_ground_;
  line(camera_center_.x, camera_center_.y, projection_point_x, ground_pos_y_);

  // initial intersection
  // var init_intersec_x = init_camera_center.x + machineHeightM*pixelsPerMeter*tan(radians(initial_camera_angle_deg));
  // stroke(255, 0, 0);
  // strokeWeight(4);
  // line(init_intersec_x, ground_pos_y_ + error_pos, projection_point_x, ground_pos_y_ + error_pos);

  stroke(0, 0, 0);
  strokeWeight(2);

  // left side
  var camera_angle_with_ground_left_side_ = radians(-initial_camera_angle_deg) + radians(machine_angle_);
  projection_point_x = camera_center_.x + tan(camera_angle_with_ground_left_side_)*camera_distance_from_ground_;
  line(camera_center_.x, camera_center_.y, projection_point_x, ground_pos_y_);

  // initial intersection
  // var init_intersec_x = init_camera_center.x - machineHeightM*pixelsPerMeter*tan(radians(initial_camera_angle_deg));
  // stroke(255, 0, 0);
  // strokeWeight(4);
  // line(init_intersec_x, ground_pos_y_ + error_pos, projection_point_x, ground_pos_y_ + error_pos);

  // // middle
  var camera_angle_with_ground_middle = radians(angle_from_optical_axis) + radians(machine_angle_);
  projection_point_x = camera_center_.x + tan(camera_angle_with_ground_middle)*camera_distance_from_ground_;
  line(camera_center_.x, camera_center_.y, projection_point_x, ground_pos_y_);

  // initial intersection
  var init_intersec_x = init_camera_center.x - machineHeightM*pixelsPerMeter*tan(radians(-angle_from_optical_axis));
  if(init_intersec_x - projection_point_x > 0){
    stroke(0,255,0)
  }else{
    stroke(255, 0, 0);
  }
  strokeWeight(4);
  line(init_intersec_x, ground_pos_y_ + error_pos, projection_point_x, ground_pos_y_ + error_pos);
  return  (projection_point_x - init_intersec_x)/pixelsPerMeter;
}

function draw_static_camera(ground_pos_y_, camera_center_){
  stroke(100, 100, 100);
  strokeWeight(2);

  var camera_angle_with_ground_right_side = radians(initial_camera_angle_deg);
  camera_distance_from_ground = ground_pos_y_ - camera_center_.y;
  projection_point_x = camera_center_.x + tan(camera_angle_with_ground_right_side)*camera_distance_from_ground;
  line(camera_center_.x, camera_center_.y, projection_point_x, ground_pos_y_);

  // middle
  var camera_angle_with_ground_left_side = radians(-initial_camera_angle_deg);
  camera_distance_from_ground = ground_pos_y_ - camera_center_.y;
  projection_point_x = camera_center_.x + tan(camera_angle_with_ground_left_side)*camera_distance_from_ground;
  line(camera_center_.x, camera_center_.y, projection_point_x, ground_pos_y_);


  var camera_angle_with_ground_middle = radians(angle_from_optical_axis);
  camera_distance_from_ground = ground_pos_y_ - camera_center_.y;
  projection_point_x = camera_center_.x + tan(camera_angle_with_ground_middle)*camera_distance_from_ground;
  line(camera_center_.x, camera_center_.y, projection_point_x, ground_pos_y_);

}

function resetPlotPoints(){
  points = [];
    plot.setPoints(points);
}

function drawRigthWheelHeight(current_wheel_position_, initial_whee_position, current_angle_, machine_width_){
  stroke(0,0,255)
  strokeWeight(2);
  line(current_wheel_position_.x + 5, current_wheel_position_.y, current_wheel_position_.x + 5, initial_whee_position.y)
  var height = machine_width_ * sin( current_angle_)
  stroke(0,0,0)
  strokeWeight(1);
  text(nf(height/pixelsPerMeter,1,2) + " m", current_wheel_position_.x + 10 , initial_whee_position.y - (initial_whee_position.y - current_wheel_position_.y)/2)

}
