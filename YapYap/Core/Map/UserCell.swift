//
//  UserCell.swift
//  YapYap
//
//  Created by harryhou on 6/4/24.
//

import SwiftUI
import MapKit


struct UserCell: View {
    

    
    let selectedRadius: Double
    @State private var cameraPosition: MapCameraPosition = .region(.userRegion)
    var userLocation: CLLocationCoordinate2D?
    
    let post1 = CLLocationCoordinate2D(
        latitude: 25.033964,
        longitude: 121.564468)
    
    let post2 = CLLocationCoordinate2D(
        latitude:  25.101992,
        longitude: 121.548663)
    
    let post3 = CLLocationCoordinate2D(
        latitude: 25.03556,
        longitude: 121.51972)
    
    
    var body: some View {
        NavigationView{
            
            
            Map(position: $cameraPosition, interactionModes: [.pan]){
                Annotation("My location", coordinate: MainTabView.userLocation!) {
                    ZStack{
                        Circle()
                            .frame(width:10, height: 10)
                            .foregroundStyle(.blue)
                        Circle()
                            .frame(width: 95 * (1 + (selectedRadius - 1)/3), height: 95 * (1 + (selectedRadius - 1)/3))
                            .scaleEffect(1)
                            .foregroundStyle(.blue.opacity(0.25))
                    }
                }
                Marker("June 6th", coordinate: post1)
                Marker("July 16th", coordinate: post2)
                Marker("November 28th", coordinate: post3)
                
                
                
            }
        
           
            .overlay(alignment:.bottom){
                NavigationLink(destination: DistanceBar(userLocation: MainTabView.userLocation!, userRegion: .userRegion)) {
                    Text("Custom Range")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.green)
                        .cornerRadius(8)
                }
                .padding()
                
            }
        }
    }
}

extension CLLocationCoordinate2D {
    static var userLocation: CLLocationCoordinate2D {
        
        return MainTabView.userLocation!
    }
}

extension MKCoordinateRegion {
    static var userRegion: MKCoordinateRegion {
        return .init(center: .userLocation,
                     latitudinalMeters: 10000,
                     longitudinalMeters: 10000)
    }
}

#Preview {
    UserCell(selectedRadius: 1.0, userLocation: MainTabView.userLocation)
}
