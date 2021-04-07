syntax = "proto2";

package pbCurveList;

message PbCurveList
{
    repeated string pointAttrNames = 6;
    repeated string curveAttrNames = 7;
    repeated Curve curveList = 5;
}

message Curve
{
    required uint32 id = 4;
    repeated Point pointList = 3;
    repeated float valueList = 2;
}

message Point {
    repeated float valueList = 1;
}