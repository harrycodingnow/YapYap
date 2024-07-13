//
//  DistanceBar.swift
//  YapYap
//
//  Created by harryhou on 6/6/24.
//
import SwiftUI
import MapKit

struct DistanceBar: View {
    let userLocation: CLLocationCoordinate2D
    let userRegion: MKCoordinateRegion
    @State private var scale: Double = 1
    @State private var selectedRadius: Int? = nil
    @State private var cameraPosition: MapCameraPosition = .region(.userRegion)
    
    var body: some View {
        
        
        NavigationView {
            
            Map(position: $cameraPosition, interactionModes: [.pan]){
                
                Annotation("My location", coordinate: MainTabView.userLocation!) {
                    
                    ZStack {
                        Circle()
                            .frame(width:10, height: 10)
                            .foregroundStyle(.blue)
                        Circle()
                            .frame(width: 95 * (1 + (scale - 1)/3), height: 95 * (1 + (scale - 1)/3))
                            .scaleEffect(1)
                            .foregroundStyle(.blue.opacity(0.25))
                    }
                }
            }
           
        }.overlay(){
            VStack {
                
                Spacer()
                
                HStack {
                    Slider(value: $scale, in: 1...10)
                        
                        .accentColor(.green)
                    
                    Text(String(format: "%.1f km", scale))
                        .frame(width: 75, height: 25)
                        .foregroundColor(.white)
                        .background(Color.green)
                        .cornerRadius(8)
                    
                }.padding()
               
                NavigationLink(destination: UserCell(selectedRadius: scale)) {
                    Text("Apply")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.green)
                        .cornerRadius(8)
                }
                .padding()
            }
            .padding()
        }
    }
}


#Preview {
    DistanceBar(userLocation: MainTabView.userLocation!, userRegion: .userRegion)
}
