//
//  UploadPostView.swift
//  YapYap
//
//  Created by harryhou on 6/10/24.
//

import SwiftUI

struct UploadPostView: View {
    @State private var caption: String = ""
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack {
            HStack {
                Button {
                    // Action to dismiss the view
                    presentationMode.wrappedValue.dismiss()
                } label: {
                    Text("Cancel")
                        .foregroundColor(Color(.systemGreen))
                }
                Spacer()
                
                Button {
                    // Action to post the content
                    postYap()
                } label: {
                    Text("Yap")
                        .bold()
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .background(Color(.systemGreen))
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                }
            }
            .padding()
            
            HStack(alignment: .top) {
                TextArea(placeholder: "What's Yappening?", text: $caption)
                    .padding(.leading, 4)
            }
            .padding()
            
            Spacer()
        }
    }
    
    // Function to handle post action
    private func postYap() {
        print("Yap posted: \(caption)")
        
        
        // Dismiss the view after posting
        presentationMode.wrappedValue.dismiss()
    }
}

struct TextArea: UIViewRepresentable {
    let placeholder: String
    @Binding var text: String

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.font = .systemFont(ofSize: 18)
        textView.delegate = context.coordinator
        textView.text = placeholder
        textView.textColor = .placeholderText
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        if text.isEmpty {
            uiView.text = placeholder
            uiView.textColor = .placeholderText
        } else {
            uiView.text = text
            uiView.textColor = .label
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UITextViewDelegate {
        var parent: TextArea

        init(_ parent: TextArea) {
            self.parent = parent
        }

        func textViewDidBeginEditing(_ textView: UITextView) {
            if textView.textColor == .placeholderText {
                textView.text = nil
                textView.textColor = .label
            }
        }

        func textViewDidEndEditing(_ textView: UITextView) {
            if textView.text.isEmpty {
                textView.text = parent.placeholder
                textView.textColor = .placeholderText
            }
        }

        func textViewDidChange(_ textView: UITextView) {
            parent.text = textView.text
        }
    }
}

#Preview {
    UploadPostView()
}
